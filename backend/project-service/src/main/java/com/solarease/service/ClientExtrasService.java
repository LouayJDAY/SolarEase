package com.solarease.service;

import com.solarease.dto.*;
import com.solarease.entity.*;
import com.solarease.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.solarease.storage.FileStorageService;

import java.time.Instant;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientExtrasService {

    private final NotificationRepository notificationRepository;
    private final ConversationRepository conversationRepository;
    private final DocumentRepository documentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationWebSocketService notificationService;
    private final FileStorageService fileStorageService;

    public List<NotificationDto> getNotifications(String clientId) {
        List<NotificationEntity> list = notificationRepository.findByClientIdOrderByCreatedAtDesc(clientId);
        return list.stream().map(n -> new NotificationDto(String.valueOf(n.getId()), n.getTitle(), n.getMessage(), n.isReadFlag(), n.getCreatedAt())).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ConversationDto> getConversations(String clientId, Long projectId) {
        List<ConversationEntity> convs = projectId == null
                ? conversationRepository.findByClientId(clientId)
                : conversationRepository.findByClientIdAndProjectId(clientId, projectId);
        return convs.stream().map(conv -> toConversationDto(conv, clientId, null)).collect(Collectors.toList());
    }

    @Transactional
    public List<ConversationDto> getProjectConversations(Long projectId) {
        return getProjectConversations(projectId, null, null);
    }

    @Transactional
    public List<ConversationDto> getProjectConversations(Long projectId, String currentUserId, String currentUserRole) {
        ConversationEntity conv = getOrCreateByProjectId(projectId);
        return List.of(toConversationDto(conv, currentUserId, currentUserRole));
    }

    @Transactional
    public MessageDto sendMessage(String clientId, String conversationId, Long projectId, MessageDto message) {
        validateMessagePayload(message.getContent(), null);
        ConversationEntity conv = resolveConversation(conversationId, clientId, projectId);
        return appendMessage(conv, clientId, message);
    }

    @Transactional
    public MessageDto sendProjectMessage(Long projectId, MessageDto message) {
        validateMessagePayload(message.getContent(), null);
        ConversationEntity conv = getOrCreateByProjectId(projectId);
        return appendMessage(conv, message.getSenderId(), message);
    }

    @Transactional
    public MessageDto sendProjectMessage(Long projectId, MessageDto message, MultipartFile file) {
        validateMessagePayload(message.getContent(), file);
        if (file != null && !file.isEmpty()) {
            FileStorageService.StoredFile stored = fileStorageService.saveMessageAttachment(projectId, file);
            message.setAttachmentFileName(stored.fileName());
            message.setAttachmentOriginalName(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : stored.fileName());
            message.setAttachmentContentType(stored.contentType());
            message.setAttachmentSizeBytes(file.getSize());
            message.setAttachmentUrl(stored.publicUrl());
            if (message.getContent() == null || message.getContent().isBlank()) {
                message.setContent("📎 " + message.getAttachmentOriginalName());
            }
        }
        return sendProjectMessage(projectId, message);
    }

    @Transactional
    public MessageDto sendMessage(String clientId, String conversationId, Long projectId, MessageDto message,
            MultipartFile file) {
        validateMessagePayload(message.getContent(), file);
        ConversationEntity conv = resolveConversation(conversationId, clientId, projectId);
        Long effectiveProjectId = conv.getProjectId() != null ? conv.getProjectId() : projectId;
        if (file != null && !file.isEmpty() && effectiveProjectId != null) {
            FileStorageService.StoredFile stored = fileStorageService.saveMessageAttachment(effectiveProjectId, file);
            message.setAttachmentFileName(stored.fileName());
            message.setAttachmentOriginalName(
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : stored.fileName());
            message.setAttachmentContentType(stored.contentType());
            message.setAttachmentSizeBytes(file.getSize());
            message.setAttachmentUrl(stored.publicUrl());
            if (message.getContent() == null || message.getContent().isBlank()) {
                message.setContent("📎 " + message.getAttachmentOriginalName());
            }
        }
        return appendMessage(conv, clientId, message);
    }

    private void validateMessagePayload(String content, MultipartFile file) {
        boolean hasContent = content != null && !content.isBlank();
        boolean hasFile = file != null && !file.isEmpty();
        if (!hasContent && !hasFile) {
            throw new IllegalArgumentException("Message content or attachment is required");
        }
    }

    // ── Conversation helpers ──────────────────────────────────────────────────

    /**
     * Guarantees exactly one conversation per project. Creates with role-based
     * participant labels on first access.
     */
    @Transactional
    private ConversationEntity getOrCreateByProjectId(Long projectId) {
        return conversationRepository.findFirstByProjectId(projectId)
                .orElseGet(() -> {
                    ConversationEntity c = new ConversationEntity();
                    c.setProjectId(projectId);
                    projectRepository.findById(projectId).ifPresent(p -> {
                        if (p.getInstallerId() != null)       c.getParticipants().add("Installateur");
                        if (p.getAssignedByAdminId() != null) c.getParticipants().add("Admin");
                        if (p.getClientId() != null) {
                            c.getParticipants().add("Client");
                            // Set clientId so the client REST endpoint (findByClientId) can find this conversation
                            clientRepository.findById(p.getClientId())
                                    .filter(cl -> cl.getUserId() != null && !cl.getUserId().isBlank())
                                    .ifPresent(cl -> c.setClientId(cl.getUserId()));
                        }
                    });
                    return conversationRepository.save(c);
                });
    }

    private ConversationEntity resolveConversation(String conversationId, String clientId, Long projectId) {
        Long cid = null;
        try {
            String numeric = conversationId == null ? "" : conversationId.replaceAll("[^0-9]", "");
            if (!numeric.isBlank()) cid = Long.parseLong(numeric);
        } catch (NumberFormatException ignored) {
            cid = null;
        }

        ConversationEntity conv = cid == null ? null : conversationRepository.findById(cid).orElse(null);
        if (conv == null) {
            conv = new ConversationEntity();
            conv.setClientId(clientId);
            conv.setProjectId(projectId);
            conv.getParticipants().add(clientId);
        }
        return conv;
    }

    private ConversationDto toConversationDto(ConversationEntity c, String currentUserId, String currentUserRole) {
        return new ConversationDto(
                String.valueOf(c.getId()),
                c.getProjectId(),
                c.getParticipants(),
                c.getMessages().stream()
                    .filter(m -> isVisibleTo(m, currentUserId, currentUserRole))
                    .map(m -> toMessageDto(m, c))
                    .collect(Collectors.toList())
        );
    }

    private MessageDto toMessageDto(MessageEntity m, ConversationEntity conv) {
        String attachmentUrl = null;
        if (m.getAttachmentFileName() != null && conv.getProjectId() != null) {
            attachmentUrl = "/api/files/message-attachments/" + conv.getProjectId() + "/" + m.getAttachmentFileName();
        }
        return new MessageDto(
                String.valueOf(m.getId()),
                String.valueOf(conv.getId()),
                m.getSenderId(),
                m.getSenderName(),
                m.getSenderRole(),
                m.getRecipientRoles(),
                m.getContent(),
                m.getTimestamp(),
                m.getAttachmentFileName(),
                m.getAttachmentOriginalName(),
                m.getAttachmentContentType(),
                m.getAttachmentSizeBytes(),
                attachmentUrl);
    }

    private MessageDto appendMessage(ConversationEntity conv, String senderId, MessageDto message) {
        MessageEntity me = new MessageEntity();
        me.setConversation(conv);
        me.setSenderId(message.getSenderId() != null ? message.getSenderId() : senderId);
        me.setSenderName(message.getSenderName());
        me.setSenderRole(message.getSenderRole());
        me.setRecipientRoles(normalizeRecipientRoles(message.getRecipientRoles(), message.getSenderRole()));
        me.setContent(message.getContent() != null ? message.getContent() : "");
        me.setTimestamp(Instant.now());
        me.setAttachmentFileName(message.getAttachmentFileName());
        me.setAttachmentOriginalName(message.getAttachmentOriginalName());
        me.setAttachmentContentType(message.getAttachmentContentType());
        me.setAttachmentSizeBytes(message.getAttachmentSizeBytes());
        conv.getMessages().add(me);
        conversationRepository.save(conv);

        MessageDto saved = toMessageDto(me, conv);

        if (conv.getProjectId() != null) {
            // Push real-time WS frame to all subscribers of this project
            try {
                messagingTemplate.convertAndSend("/topic/project-messages/" + conv.getProjectId(), saved);
            } catch (Exception ex) {
                log.warn("WS push failed for project {}: {}", conv.getProjectId(), ex.getMessage());
            }

            // Notify other actors (not the sender) via persistent notification + WS
            notifyOtherActors(conv.getProjectId(), saved);
        }
        return saved;
    }

    private List<String> normalizeRecipientRoles(List<String> recipientRoles, String senderRole) {
        if (recipientRoles == null || recipientRoles.isEmpty()) {
            return new ArrayList<>();
        }
        return recipientRoles.stream()
                .filter(role -> role != null && !role.isBlank())
                .map(role -> role.toUpperCase())
                .distinct()
                .filter(role -> !role.equalsIgnoreCase(senderRole))
                .collect(Collectors.toList());
    }

    private boolean isVisibleTo(MessageEntity message, String currentUserId, String currentUserRole) {
        if (currentUserRole == null) {
            return true;
        }
        if ("ADMIN".equalsIgnoreCase(currentUserRole)) {
            return true;
        }
        if (message.getSenderId() != null && message.getSenderId().equals(currentUserId)) {
            return true;
        }
        if (message.getRecipientRoles() == null || message.getRecipientRoles().isEmpty()) {
            return true;
        }
        return message.getRecipientRoles().stream()
                .anyMatch(role -> role.equalsIgnoreCase(currentUserRole));
    }

    /**
     * Resolves the set of userIds for the project's admin, installer, and client,
     * removes the sender, and fires a "new message" notification to each remaining actor.
     */
    private void notifyOtherActors(Long projectId, MessageDto saved) {
        try {
            projectRepository.findById(projectId).ifPresent(project -> {
                Set<String> targets = new HashSet<>();
                boolean targetInstaller = saved.getRecipientRoles() == null || saved.getRecipientRoles().isEmpty()
                        || saved.getRecipientRoles().stream().anyMatch(role -> role.equalsIgnoreCase("INSTALLER"));
                boolean targetAdmin = saved.getRecipientRoles() == null || saved.getRecipientRoles().isEmpty()
                        || saved.getRecipientRoles().stream().anyMatch(role -> role.equalsIgnoreCase("ADMIN"));
                boolean targetClient = saved.getRecipientRoles() == null || saved.getRecipientRoles().isEmpty()
                        || saved.getRecipientRoles().stream().anyMatch(role -> role.equalsIgnoreCase("CLIENT"));

                if (targetInstaller && project.getInstallerId() != null && !project.getInstallerId().isBlank()) {
                    targets.add(project.getInstallerId());
                }
                if (targetAdmin && project.getAssignedByAdminId() != null && !project.getAssignedByAdminId().isBlank()) {
                    targets.add(project.getAssignedByAdminId());
                }
                if (targetClient && project.getClientId() != null) {
                    clientRepository.findById(project.getClientId())
                            .filter(c -> c.getUserId() != null && !c.getUserId().isBlank())
                            .ifPresent(c -> targets.add(c.getUserId()));
                }
                targets.remove(saved.getSenderId());
                String senderName = saved.getSenderName() != null ? saved.getSenderName() : "Un participant";
                targets.forEach(uid ->
                        notificationService.notifyNewMessage(uid, senderName, project.getName()));
            });
        } catch (Exception ex) {
            log.warn("Could not send new-message notifications for project {}: {}", projectId, ex.getMessage());
        }
    }

    // ── Documents / Invoices ─────────────────────────────────────────────────

    public List<DocumentDto> getDocuments(String clientId) {
        List<DocumentEntity> docs = documentRepository.findByClientId(clientId);
        return docs.stream()
            .map(d -> new DocumentDto(
                String.valueOf(d.getId()),
                d.getName(),
                d.getType().name(),
                "DISPONIBLE",
                d.getSize(),
                d.getDate(),
                d.getUrl()
            ))
            .collect(Collectors.toList());
    }

    public List<InvoiceDto> getInvoices(String clientId) {
        List<String> ids = new ArrayList<>();
        ids.add(clientId);
        clientRepository.findByUserId(clientId)
            .ifPresent(c -> ids.add(String.valueOf(c.getId())));

        List<InvoiceEntity> invs = invoiceRepository.findByClientIdIn(ids);
        return invs.stream()
            .map(i -> new InvoiceDto(
                String.valueOf(i.getId()),
                i.getNumber(),
                i.getDate(),
                i.getDueDate(),
                i.getAmount().doubleValue(),
                i.getSubtotal() != null ? i.getSubtotal().doubleValue() : null,
                i.getDiscountPercent() != null ? i.getDiscountPercent().doubleValue() : null,
                i.getDiscountAmount() != null ? i.getDiscountAmount().doubleValue() : null,
                i.getStatus().name(),
                i.getNotes()
            ))
            .collect(Collectors.toList());
    }
}
