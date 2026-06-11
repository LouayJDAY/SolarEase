package com.solarease.service;

import com.solarease.dto.SupportTicketCreateRequest;
import com.solarease.dto.SupportTicketResponse;
import com.solarease.dto.SupportTicketUpdateRequest;
import com.solarease.entity.Client;
import com.solarease.entity.SupportTicket;
import com.solarease.enums.SupportTicketPriority;
import com.solarease.enums.SupportTicketStatus;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.SupportTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final ClientRepository clientRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    @Transactional
    public SupportTicketResponse createTicket(String clientUserId, SupportTicketCreateRequest request) {
        SupportTicketPriority priority = request.getPriority() != null
                ? request.getPriority()
                : SupportTicketPriority.NORMAL;

        SupportTicket ticket = SupportTicket.builder()
                .clientUserId(clientUserId)
                .subject(request.getSubject())
                .description(request.getDescription())
                .status(SupportTicketStatus.OPEN)
                .priority(priority)
                .build();

        SupportTicket saved = supportTicketRepository.save(ticket);
        log.info("Support ticket {} created by client {}", saved.getId(), clientUserId);

        Client client = clientRepository.findByUserId(clientUserId).orElse(null);
        String clientName = client != null
                ? client.getFirstName() + " " + client.getLastName()
                : "Client";

        if (client != null && client.getInstallerId() != null && !client.getInstallerId().isBlank()) {
            notificationWebSocketService.notifySupportTicketCreated(
                    client.getInstallerId(),
                    clientName,
                    saved.getSubject(),
                    saved.getId());
        }

        notificationWebSocketService.notifySupportTicketCreatedForAdmin(
                clientName,
                saved.getSubject(),
                saved.getId());
        notificationWebSocketService.notifyAdminDashboardRefresh("SUPPORT_TICKET_CREATED");

        return mapToResponse(saved, client);
    }

    public List<SupportTicketResponse> getTicketsForClient(String clientUserId) {
        return supportTicketRepository.findByClientUserIdOrderByCreatedAtDesc(clientUserId).stream()
                .map(t -> mapToResponse(t, clientRepository.findByUserId(t.getClientUserId()).orElse(null)))
                .collect(Collectors.toList());
    }

    public SupportTicketResponse getTicketById(String clientUserId, Long id) {
        SupportTicket ticket = supportTicketRepository.findByIdAndClientUserId(id, clientUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found: " + id));
        return mapToResponse(ticket, clientRepository.findByUserId(ticket.getClientUserId()).orElse(null));
    }

    public List<SupportTicketResponse> getAllTicketsForAdmin() {
        return supportTicketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(t -> mapToResponse(t, clientRepository.findByUserId(t.getClientUserId()).orElse(null)))
                .collect(Collectors.toList());
    }

    public SupportTicketResponse getTicketByIdForAdmin(Long id) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found: " + id));
        return mapToResponse(ticket, clientRepository.findByUserId(ticket.getClientUserId()).orElse(null));
    }

    public long countOpenTickets() {
        return supportTicketRepository.countByStatus(SupportTicketStatus.OPEN);
    }

    @Transactional
    public SupportTicketResponse updateTicketStatusForAdmin(Long id, SupportTicketUpdateRequest request) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found: " + id));

        ticket.setStatus(request.getStatus());
        if (request.getStatus() == SupportTicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        } else if (request.getStatus() == SupportTicketStatus.OPEN) {
            ticket.setResolvedAt(null);
        }

        SupportTicket saved = supportTicketRepository.save(ticket);
        Client client = clientRepository.findByUserId(saved.getClientUserId()).orElse(null);

        if (client != null) {
            String statusLabel = switch (saved.getStatus()) {
                case IN_PROGRESS -> "en cours de traitement";
                case RESOLVED -> "résolu";
                default -> "ouvert";
            };
            notificationWebSocketService.notifyUser(
                    saved.getClientUserId(),
                    "Ticket support mis à jour",
                    String.format("Votre ticket « %s » est maintenant %s.", saved.getSubject(), statusLabel));
        }

        return mapToResponse(saved, client);
    }

    private SupportTicketResponse mapToResponse(SupportTicket ticket, Client client) {
        SupportTicketResponse.SupportTicketResponseBuilder builder = SupportTicketResponse.builder()
                .id(ticket.getId())
                .clientUserId(ticket.getClientUserId())
                .subject(ticket.getSubject())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt());

        if (client != null) {
            builder.clientName(client.getFirstName() + " " + client.getLastName());
            builder.clientEmail(client.getEmail());
        }

        return builder.build();
    }
}
