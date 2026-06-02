package com.solarease.service;

import com.solarease.dto.QuoteDTO;
import com.solarease.entity.InvoiceEntity;
import com.solarease.entity.Project;
import com.solarease.entity.QuoteEntity;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.InvoiceRepository;
import com.solarease.repository.NotificationRepository;
import com.solarease.repository.ProjectRepository;
import com.solarease.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final ProjectRepository projectRepository;
    private final InvoiceRepository invoiceRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationWebSocketService notificationWebSocketService;
    private final N8nInvoiceWebhookService n8nInvoiceWebhookService;
    private final ClientRepository clientRepository;

    /**
     * Create a new quote (DRAFT status)
     */
    public QuoteDTO createQuote(Long projectId, String callerId, String userRole, QuoteDTO quoteDTO) {
        log.info("Creating quote for project {} by {} (role={})", projectId, callerId, userRole);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        Long clientId = project.getClientId();

        boolean isAdmin = "ADMIN".equalsIgnoreCase(userRole);

        // For installers, verify they own the project
        if (!isAdmin && project.getInstallerId() != null && !project.getInstallerId().equals(callerId)) {
            throw new IllegalArgumentException("Installer is not allowed to create quotes for this project");
        }

        // Determine the effective installerId to attach to the quote
        String installerId = isAdmin && project.getInstallerId() != null
                ? project.getInstallerId()
                : callerId;

        // Generate unique quote number
        String quoteNumber = generateQuoteNumber();

        // Calculate total amount
        BigDecimal total = quoteDTO.getLaborCost()
                .add(quoteDTO.getMaterialsCost())
                .add(quoteDTO.getTax() != null ? quoteDTO.getTax() : BigDecimal.ZERO);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime validUntil = quoteDTO.getValidUntil() != null ?
                quoteDTO.getValidUntil() :
                now.plus(30, ChronoUnit.DAYS); // Default 30 days validity

        QuoteEntity quote = QuoteEntity.builder()
                .quoteNumber(quoteNumber)
                .project(project)
                .clientId(clientId)
                .installerId(installerId)
                .status(QuoteEntity.QuoteStatus.DRAFT)
                .description(quoteDTO.getDescription())
                .laborCost(quoteDTO.getLaborCost())
                .materialsCost(quoteDTO.getMaterialsCost())
                .tax(quoteDTO.getTax() != null ? quoteDTO.getTax() : BigDecimal.ZERO)
                .totalAmount(total)
                .validUntil(validUntil)
                .createdAt(now)
                .updatedAt(now)
                .notes(quoteDTO.getNotes())
                .build();

        QuoteEntity savedQuote = quoteRepository.save(quote);
        log.info("Quote created: {}", quoteNumber);

        return mapToDTO(savedQuote);
    }

    /**
     * Get all quotes (admin only)
     */
    public Page<QuoteDTO> getAllQuotes(Pageable pageable) {
        return quoteRepository.findAll(pageable).map(this::mapToDTO);
    }

    /**
     * Send quote to client (DRAFT → SENT)
     */
    public QuoteDTO sendQuote(Long quoteId, String installerId, String userRole) {
        log.info("Sending quote {} from installer {} (role={})", quoteId, installerId, userRole);

        QuoteEntity quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + quoteId));

        // Admins can send any quote; installers must own it
        if (!"ADMIN".equalsIgnoreCase(userRole) && !quote.getInstallerId().equals(installerId)) {
            throw new IllegalArgumentException("Installer does not own this quote");
        }

        // Check if quote is in DRAFT status
        if (!quote.getStatus().equals(QuoteEntity.QuoteStatus.DRAFT)) {
            throw new IllegalStateException("Cannot send quote that is not in DRAFT status");
        }

        quote.setStatus(QuoteEntity.QuoteStatus.SENT);
        quote.setSentAt(LocalDateTime.now());
        QuoteEntity updated = quoteRepository.save(quote);

        String clientIdStr = String.valueOf(updated.getClientId());
        notificationWebSocketService.notifyQuoteSent(clientIdStr, updated.getQuoteNumber(), updated.getProject().getId());
        log.info("Quote sent to client");

        return mapToDTO(updated);
    }

    /**
     * Accept quote (SENT → ACCEPTED)
     */
    public QuoteDTO acceptQuote(Long quoteId, String clientUserId) {
        Long clientId = parseLongOrNull(clientUserId);
        log.info("Accepting quote {} by client {}", quoteId, clientId);

        QuoteEntity quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + quoteId));

        // Verify client owns the quote
        if (clientId != null && !quote.getClientId().equals(clientId)) {
            throw new IllegalArgumentException("Client does not own this quote");
        }

        Optional<InvoiceEntity> existingInvoice = invoiceRepository.findByQuoteId(quote.getId());

        // Idempotent behavior for already processed quotes.
        if (quote.getStatus().equals(QuoteEntity.QuoteStatus.INVOICED)) {
            if (existingInvoice.isPresent()) {
                return mapToDTO(quote);
            }

            InvoiceEntity regenerated = generateInvoiceFromQuote(quote);
            notificationWebSocketService.notifyInvoiceGenerated(regenerated.getClientId(), regenerated.getNumber());
            n8nInvoiceWebhookService.notifyInvoiceReady(regenerated, "quote.accepted");
            log.warn("Quote {} was INVOICED without linked invoice record. Regenerated invoice {}", quoteId, regenerated.getNumber());
            return mapToDTO(quote);
        }

        if (quote.getStatus().equals(QuoteEntity.QuoteStatus.ACCEPTED)) {
            if (existingInvoice.isPresent()) {
                quote.setStatus(QuoteEntity.QuoteStatus.INVOICED);
                quote.setUpdatedAt(LocalDateTime.now());
                QuoteEntity updated = quoteRepository.save(quote);
                return mapToDTO(updated);
            }

            InvoiceEntity regenerated = generateInvoiceFromQuote(quote);
            quote.setStatus(QuoteEntity.QuoteStatus.INVOICED);
            quote.setUpdatedAt(LocalDateTime.now());
            QuoteEntity updated = quoteRepository.save(quote);
            notificationWebSocketService.notifyInvoiceGenerated(regenerated.getClientId(), regenerated.getNumber());
            n8nInvoiceWebhookService.notifyInvoiceReady(regenerated, "quote.accepted");
            log.info("Recovered missing invoice generation for accepted quote {}", quoteId);
            return mapToDTO(updated);
        }

        // Check status
        if (!quote.getStatus().equals(QuoteEntity.QuoteStatus.SENT)) {
            throw new IllegalStateException("Cannot accept quote that is not in SENT status");
        }

        // Check if still valid
        if (LocalDateTime.now().isAfter(quote.getValidUntil())) {
            throw new IllegalStateException("Quote has expired");
        }

        quote.setStatus(QuoteEntity.QuoteStatus.ACCEPTED);
        quote.setAcceptedAt(LocalDateTime.now());
        QuoteEntity updated = quoteRepository.save(quote);

        InvoiceEntity invoice;
        if (existingInvoice.isPresent()) {
            invoice = existingInvoice.get();
        } else {
            invoice = generateInvoiceFromQuote(updated);
        }

        updated.setStatus(QuoteEntity.QuoteStatus.INVOICED);
        updated = quoteRepository.save(updated);

        notificationWebSocketService.notifyQuoteAccepted(updated.getInstallerId(), updated.getQuoteNumber());
        notificationWebSocketService.notifyInvoiceGenerated(invoice.getClientId(), invoice.getNumber());
        n8nInvoiceWebhookService.notifyInvoiceReady(invoice, "quote.accepted");
        log.info("Quote accepted by client");

        return mapToDTO(updated);
    }

    /**
     * Reject quote (SENT → REJECTED)
     */
    public QuoteDTO rejectQuote(Long quoteId, String clientUserId, String rejectionReason) {
        Long clientId = parseLongOrNull(clientUserId);
        log.info("Rejecting quote {} by client {}", quoteId, clientId);

        QuoteEntity quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + quoteId));

        if (clientId != null && !quote.getClientId().equals(clientId)) {
            throw new IllegalArgumentException("Client does not own this quote");
        }

        if (!quote.getStatus().equals(QuoteEntity.QuoteStatus.SENT)) {
            throw new IllegalStateException("Cannot reject quote that is not in SENT status");
        }

        quote.setStatus(QuoteEntity.QuoteStatus.REJECTED);
        quote.setRejectedAt(LocalDateTime.now());
        quote.setRejectionReason(rejectionReason);
        QuoteEntity updated = quoteRepository.save(quote);

        notificationWebSocketService.notifyQuoteRejected(updated.getInstallerId(), updated.getQuoteNumber(), rejectionReason);
        log.info("Quote rejected by client");

        return mapToDTO(updated);
    }

    /**
     * Get quote by ID
     */
    public QuoteDTO getQuoteById(Long quoteId) {
        QuoteEntity quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + quoteId));
        return mapToDTO(quote);
    }

    /**
     * Get all quotes for a project
     */
    public List<QuoteDTO> getQuotesByProjectId(Long projectId) {
        return quoteRepository.findByProject_Id(projectId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all quotes for an installer (paginated)
     */
    public Page<QuoteDTO> getQuotesByInstallerId(String installerId, Pageable pageable) {
        return quoteRepository.findByInstallerId(installerId, pageable)
                .map(this::mapToDTO);
    }

    /**
     * Get all quotes for a client (paginated)
     */
    public Page<QuoteDTO> getQuotesByClientId(Long clientId, Pageable pageable) {
        return quoteRepository.findByClientId(clientId, pageable)
                .map(this::mapToDTO);
    }

    /**
     * Get quotes for a client identified by their userId (UUID from identity-service)
     */
    public Page<QuoteDTO> getQuotesByClientUserId(String userId, Pageable pageable) {
        Long clientId = clientRepository.findByUserId(userId)
                .map(c -> c.getId())
                .orElse(null);
        if (clientId == null) {
            return Page.empty(pageable);
        }
        return getQuotesByClientId(clientId, pageable);
    }

    /**
     * Get active quotes for a project (SENT or ACCEPTED)
     */
    public List<QuoteDTO> getActiveQuotesByProjectId(Long projectId) {
        return quoteRepository.findActiveQuotesByProjectId(projectId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Update quote (only DRAFT quotes can be updated)
     */
    public QuoteDTO updateQuote(Long quoteId, String installerId, String userRole, QuoteDTO quoteDTO) {
        log.info("Updating quote {} by {} (role={})", quoteId, installerId, userRole);

        QuoteEntity quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + quoteId));

        if (!"ADMIN".equalsIgnoreCase(userRole) && !quote.getInstallerId().equals(installerId)) {
            throw new IllegalArgumentException("Installer does not own this quote");
        }

        if (!quote.getStatus().equals(QuoteEntity.QuoteStatus.DRAFT)) {
            throw new IllegalStateException("Cannot update quote that is not in DRAFT status");
        }

        // Update fields
        if (quoteDTO.getDescription() != null) {
            quote.setDescription(quoteDTO.getDescription());
        }
        if (quoteDTO.getLaborCost() != null) {
            quote.setLaborCost(quoteDTO.getLaborCost());
        }
        if (quoteDTO.getMaterialsCost() != null) {
            quote.setMaterialsCost(quoteDTO.getMaterialsCost());
        }
        if (quoteDTO.getTax() != null) {
            quote.setTax(quoteDTO.getTax());
        }
        if (quoteDTO.getNotes() != null) {
            quote.setNotes(quoteDTO.getNotes());
        }

        // Recalculate total
        BigDecimal total = quote.getLaborCost()
                .add(quote.getMaterialsCost())
                .add(quote.getTax() != null ? quote.getTax() : BigDecimal.ZERO);
        quote.setTotalAmount(total);

        QuoteEntity updated = quoteRepository.save(quote);
        log.info("Quote updated");

        return mapToDTO(updated);
    }

    /**
     * Delete quote (only DRAFT quotes can be deleted)
     */
    public void deleteQuote(Long quoteId, String installerId, String userRole) {
        log.info("Deleting quote {} by {} (role={})", quoteId, installerId, userRole);

        QuoteEntity quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote not found with id: " + quoteId));

        if (!"ADMIN".equalsIgnoreCase(userRole) && !quote.getInstallerId().equals(installerId)) {
            throw new IllegalArgumentException("Installer does not own this quote");
        }

        if (!quote.getStatus().equals(QuoteEntity.QuoteStatus.DRAFT)) {
            throw new IllegalStateException("Cannot delete quote that is not in DRAFT status");
        }

        quoteRepository.delete(quote);
        log.info("Quote deleted");
    }

    /**
     * Get count of quotes by status for an installer
     */
    public long getQuoteCountByStatus(String installerId, QuoteEntity.QuoteStatus status) {
        return quoteRepository.countByInstallerIdAndStatus(installerId, status);
    }

    // Helper methods

    private QuoteDTO mapToDTO(QuoteEntity quote) {
        String clientFirstName = null;
        String clientLastName = null;
        String projectName = null;

        if (quote.getProject() != null) {
            projectName = quote.getProject().getName();
            if (quote.getClientId() != null) {
                var clientOpt = clientRepository.findById(quote.getClientId());
                if (clientOpt.isPresent()) {
                    clientFirstName = clientOpt.get().getFirstName();
                    clientLastName = clientOpt.get().getLastName();
                }
            }
        }

        return QuoteDTO.builder()
                .id(quote.getId())
                .quoteNumber(quote.getQuoteNumber())
                .projectId(quote.getProject().getId())
                .projectName(projectName)
                .clientId(quote.getClientId())
                .clientFirstName(clientFirstName)
                .clientLastName(clientLastName)
                .installerId(quote.getInstallerId())
                .status(quote.getStatus().name())
                .description(quote.getDescription())
                .laborCost(quote.getLaborCost())
                .materialsCost(quote.getMaterialsCost())
                .tax(quote.getTax())
                .totalAmount(quote.getTotalAmount())
                .validUntil(quote.getValidUntil())
                .createdAt(quote.getCreatedAt())
                .updatedAt(quote.getUpdatedAt())
                .sentAt(quote.getSentAt())
                .acceptedAt(quote.getAcceptedAt())
                .rejectedAt(quote.getRejectedAt())
                .rejectionReason(quote.getRejectionReason())
                .notes(quote.getNotes())
                .build();
    }

    private String generateQuoteNumber() {
        // Format: QUOTE-YYYY-XXXXX
        int year = LocalDateTime.now().getYear();
        // In a real system, this would be auto-incremented per year from DB
        long randomSuffix = (long) (Math.random() * 100000);
        return String.format("QUOTE-%d-%05d", year, randomSuffix);
    }

    private InvoiceEntity generateInvoiceFromQuote(QuoteEntity quote) {
        InvoiceEntity invoice = InvoiceEntity.builder()
                .number(generateInvoiceNumber())
                .project(quote.getProject())
                .clientId(resolveInvoiceClientId(quote.getClientId()))
                .installerId(quote.getInstallerId())
                .date(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .amount(quote.getTotalAmount())
                .status(InvoiceEntity.InvoiceStatus.SENT)
                .quoteId(quote.getId())
                .notes("Facture générée automatiquement depuis le devis " + quote.getQuoteNumber())
                .build();

        return invoiceRepository.save(invoice);
    }

    private String resolveInvoiceClientId(Long clientId) {
        if (clientId == null) {
            return "0";
        }
        return clientRepository.findById(clientId)
                .map(c -> c.getUserId() != null && !c.getUserId().isBlank() ? c.getUserId() : String.valueOf(clientId))
                .orElse(String.valueOf(clientId));
    }

    private String generateInvoiceNumber() {
        int year = LocalDate.now().getYear();
        long randomSuffix = (long) (Math.random() * 100000);
        return String.format("INV-%d-%05d", year, randomSuffix);
    }

    private Long parseLongOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            // Could be a UUID from identity-service - resolve via Client.userId
            return clientRepository.findByUserId(value)
                    .map(c -> c.getId())
                    .orElse(null);
        }
    }
}
