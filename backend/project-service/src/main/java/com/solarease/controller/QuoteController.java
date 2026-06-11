package com.solarease.controller;

import com.solarease.dto.QuoteCreateRequest;
import com.solarease.dto.QuoteDTO;
import com.solarease.service.AccessControlService;
import com.solarease.service.QuoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Quote/Devis Management
 * Endpoints for creating, reading, updating quotes
 */
@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
@Slf4j
public class QuoteController {

    private final QuoteService quoteService;
    private final AccessControlService accessControlService;

    /**
     * Create a new quote for a project
     * POST /api/quotes
     * Body: QuoteDTO
     * Header: X-User-Id (installer), X-Client-Id (client)
     */
    @PostMapping
    public ResponseEntity<QuoteDTO> createQuote(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid QuoteCreateRequest request) {
        log.info("POST /api/quotes - Creating quote");
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");

        QuoteDTO quoteDTO = QuoteDTO.builder()
                .projectId(request.getProjectId())
                .description(request.getDescription())
                .laborCost(request.getLaborCost())
                .materialsCost(request.getMaterialsCost())
                .tax(request.getTax())
                .notes(request.getNotes())
                .build();

        QuoteDTO created = quoteService.createQuote(request.getProjectId(), installerId, userRole, quoteDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get quote by ID
     * GET /api/quotes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<QuoteDTO> getQuoteById(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestHeader("X-User-Role") String userRole) {
        log.info("GET /api/quotes/{} - Fetching quote", id);
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN", "CLIENT");

        QuoteDTO quote = quoteService.getQuoteById(id, userRole, userId, userEmail);
        return ResponseEntity.ok(quote);
    }

    /**
     * Get all quotes for a project
     * GET /api/quotes/project/{projectId}
     */
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<QuoteDTO>> getQuotesByProjectId(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestHeader("X-User-Role") String userRole) {
        log.info("GET /api/quotes/project/{} - Fetching quotes", projectId);
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN", "CLIENT");

        List<QuoteDTO> quotes = quoteService.getQuotesByProjectId(projectId, userRole, userId, userEmail);
        return ResponseEntity.ok(quotes);
    }

    /**
     * Get all quotes (admin only, paginated)
     * GET /api/quotes/admin/all
     */
    @GetMapping("/admin/all")
    public ResponseEntity<Page<QuoteDTO>> getAllQuotes(
            @RequestHeader("X-User-Role") String userRole,
            Pageable pageable) {
        log.info("GET /api/quotes/admin/all - Fetching all quotes");
        accessControlService.requireAnyRole(userRole, "ADMIN");

        Page<QuoteDTO> quotes = quoteService.getAllQuotes(pageable);
        return ResponseEntity.ok(quotes);
    }

    /**
     * Get all quotes for installer (paginated)
     * GET /api/quotes/installer
     * Header: X-User-Id (installer)
     */
    @GetMapping("/installer/list")
    public ResponseEntity<Page<QuoteDTO>> getQuotesByInstallerId(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
            Pageable pageable) {
        log.info("GET /api/quotes/installer/list - Fetching quotes for installer");
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");

        Page<QuoteDTO> quotes = quoteService.getQuotesByInstallerId(installerId, pageable);
        return ResponseEntity.ok(quotes);
    }

    /**
     * Get all quotes for client (paginated)
     * GET /api/quotes/client
     * Header: X-User-Id (client)
     */
    @GetMapping("/client/list")
    public ResponseEntity<Page<QuoteDTO>> getQuotesByClientId(
            @RequestHeader("X-User-Id") String clientId,
            @RequestHeader("X-User-Role") String userRole,
            Pageable pageable) {
        log.info("GET /api/quotes/client/list - Fetching quotes for client");
        accessControlService.requireAnyRole(userRole, "CLIENT", "ADMIN");

        Page<QuoteDTO> quotes = quoteService.getQuotesByClientUserId(clientId, pageable);
        return ResponseEntity.ok(quotes);
    }

    /**
     * Get active quotes for a project (SENT or ACCEPTED)
     * GET /api/quotes/project/{projectId}/active
     */
    @GetMapping("/project/{projectId}/active")
    public ResponseEntity<List<QuoteDTO>> getActiveQuotesByProjectId(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestHeader("X-User-Role") String userRole) {
        log.info("GET /api/quotes/project/{}/active - Fetching active quotes", projectId);
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN", "CLIENT");

        List<QuoteDTO> quotes = quoteService.getActiveQuotesByProjectId(projectId, userRole, userId, userEmail);
        return ResponseEntity.ok(quotes);
    }

    /**
     * Send quote to client (DRAFT → SENT)
     * PUT /api/quotes/{id}/send
     * Header: X-User-Id (installer)
     */
    @PutMapping("/{id}/send")
    public ResponseEntity<QuoteDTO> sendQuote(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole) {
        log.info("PUT /api/quotes/{}/send - Sending quote", id);
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");

        QuoteDTO updated = quoteService.sendQuote(id, installerId, userRole);
        return ResponseEntity.ok(updated);
    }

    /**
     * Mark quote as expired (SENT → EXPIRED)
     * PUT /api/quotes/{id}/expire
     */
    @PutMapping("/{id}/expire")
    public ResponseEntity<QuoteDTO> expireQuote(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String callerId,
            @RequestHeader("X-User-Role") String userRole) {
        log.info("PUT /api/quotes/{}/expire - Expiring quote", id);
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");

        QuoteDTO updated = quoteService.expireQuote(id, callerId, userRole);
        return ResponseEntity.ok(updated);
    }

    /**
     * Accept quote (SENT → ACCEPTED)
     * PUT /api/quotes/{id}/accept
     * Header: X-User-Id (client)
     */
    @PutMapping("/{id}/accept")
    public ResponseEntity<QuoteDTO> acceptQuote(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String clientId,
            @RequestHeader("X-User-Role") String userRole) {
        log.info("PUT /api/quotes/{}/accept - Accepting quote", id);
        accessControlService.requireAnyRole(userRole, "CLIENT", "ADMIN");

        QuoteDTO updated = quoteService.acceptQuote(id, clientId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Reject quote (SENT → REJECTED)
     * PUT /api/quotes/{id}/reject
     * Header: X-User-Id (client)
     * Body: { rejectionReason: "..." }
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<QuoteDTO> rejectQuote(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String clientId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody RejectionRequest request) {
        log.info("PUT /api/quotes/{}/reject - Rejecting quote", id);
        accessControlService.requireAnyRole(userRole, "CLIENT", "ADMIN");

        QuoteDTO updated = quoteService.rejectQuote(
                id,
            clientId,
                request.getRejectionReason()
        );
        return ResponseEntity.ok(updated);
    }

    /**
     * Update quote (only DRAFT quotes)
     * PATCH /api/quotes/{id}
     * Header: X-User-Id (installer)
     */
    @PatchMapping("/{id}")
    public ResponseEntity<QuoteDTO> updateQuote(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody QuoteDTO quoteDTO) {
        log.info("PATCH /api/quotes/{} - Updating quote", id);
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");

        QuoteDTO updated = quoteService.updateQuote(id, installerId, userRole, quoteDTO);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete quote (only DRAFT quotes)
     * DELETE /api/quotes/{id}
     * Header: X-User-Id (installer)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuote(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole) {
        log.info("DELETE /api/quotes/{} - Deleting quote", id);
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");

        quoteService.deleteQuote(id, installerId, userRole);
        return ResponseEntity.noContent().build();
    }

    // Helper class for rejection request
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RejectionRequest {
        private String rejectionReason;
    }
}
