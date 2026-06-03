package com.solarease.controller;

import com.solarease.dto.DemandCreateRequest;
import com.solarease.dto.DemandDTO;
import com.solarease.dto.InvitationRequest;
import com.solarease.dto.PublicDemandCreateRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.enums.DemandPriority;
import com.solarease.enums.DemandSource;
import com.solarease.enums.DemandStatus;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.service.AccessControlService;
import com.solarease.service.DemandService;
import com.solarease.service.InvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/demands")
@RequiredArgsConstructor
@Slf4j
public class DemandController {

    private final DemandService demandService;
    private final AccessControlService accessControlService;
    private final InvitationService invitationService;

    // ── CLIENT: submit a new demand ──────────────────────────────────────────

    @PostMapping("/public")
    @ResponseStatus(HttpStatus.CREATED)
    public DemandDTO createPublicDemand(@Valid @RequestBody PublicDemandCreateRequest request) {
        log.info("POST /api/demands/public by anonymous user with email {}", request.getEmail());
        return demandService.createPublicDemand(request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DemandDTO createDemand(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Email") String email,
            @RequestHeader(value = "X-User-FirstName", required = false, defaultValue = "") String firstName,
            @RequestHeader(value = "X-User-LastName", required = false, defaultValue = "") String lastName,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody DemandCreateRequest request) {

        accessControlService.requireAnyRole(userRole, "CLIENT", "ADMIN");
        log.info("POST /api/demands by user {}", userId);
        return demandService.createDemand(userId, email, firstName, lastName, request);
    }

    // ── CLIENT: list own demands ─────────────────────────────────────────────

    @GetMapping("/my")
    public Page<DemandDTO> getMyDemands(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        accessControlService.requireAnyRole(userRole, "CLIENT", "ADMIN");
        return demandService.getMyDemands(userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
    }

    // ── ADMIN: list / search demands ─────────────────────────────────────────

    @GetMapping
    public Page<DemandDTO> getAllDemands(
            @RequestHeader("X-User-Role") String userRole,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        accessControlService.requireAnyRole(userRole, "ADMIN");
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        DemandStatus statusFilter = parseEnum(DemandStatus.class, status);
        DemandSource sourceFilter = parseEnum(DemandSource.class, source);

        if (statusFilter == null && sourceFilter == null && (q == null || q.isBlank())) {
            return demandService.getAllDemands(pageable);
        }
        return demandService.searchDemands(statusFilter, sourceFilter, q, pageable);
    }

    // ── ADMIN or owner: read one ─────────────────────────────────────────────

    @GetMapping("/{id}")
    public DemandDTO getDemand(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {

        accessControlService.requireAnyRole(userRole, "ADMIN", "CLIENT");
        DemandDTO demand = demandService.getDemandById(id);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userRole);
        boolean isOwner = userId != null && userId.equals(demand.getClientUserId());
        if (!isAdmin && !isOwner) {
            throw new ResourceNotFoundException("Demand not found: " + id);
        }
        return demand;
    }

    // ── ADMIN: update status ─────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    public DemandDTO updateStatus(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody Map<String, String> body) {

        accessControlService.requireAnyRole(userRole, "ADMIN");
        DemandStatus newStatus = DemandStatus.valueOf(body.get("status").toUpperCase());
        String adminNote = body.get("adminNote");
        String rejectionReason = body.get("rejectionReason");
        return demandService.updateStatus(id, newStatus, adminNote, rejectionReason);
    }

    // ── ADMIN: assignment & priority ────────────────────────────────────────

    @PatchMapping("/{id}/assign")
    public DemandDTO assignDemand(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String callerId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody(required = false) Map<String, String> body) {

        accessControlService.requireAnyRole(userRole, "ADMIN");
        String adminId = body == null ? null : body.get("adminId");
        // shortcut: "assign to me" if no body provided
        if (adminId == null || adminId.isBlank()) {
            adminId = callerId;
        }
        return demandService.assignDemand(id, adminId);
    }

    @PatchMapping("/{id}/priority")
    public DemandDTO updatePriority(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody Map<String, String> body) {

        accessControlService.requireAnyRole(userRole, "ADMIN");
        DemandPriority priority = parseEnum(DemandPriority.class, body.get("priority"));
        return demandService.updatePriority(id, priority);
    }

    // ── ADMIN: convert demand to project ─────────────────────────────────────

    @PostMapping("/{id}/convert-to-project")
    public ProjectResponse convertToProject(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String adminId,
            @RequestHeader("X-User-Email") String adminEmail,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody Map<String, Object> body) {

        accessControlService.requireAnyRole(userRole, "ADMIN");
        Long clientId = Long.valueOf(body.get("clientId").toString());
        Double latitude = parseOptionalDouble(body.get("latitude"));
        Double longitude = parseOptionalDouble(body.get("longitude"));
        return demandService.convertToProject(id, clientId, adminId, adminEmail, latitude, longitude);
    }

    /**
     * Promote a PUBLIC demand into an items_client row (or reuse existing one
     * matched by email) and convert it in one shot. Returns the created project.
     */
    @PostMapping("/{id}/promote-public-to-client")
    public ProjectResponse promotePublicToClient(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String adminId,
            @RequestHeader("X-User-Email") String adminEmail,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody(required = false) Map<String, Object> body) {

        accessControlService.requireAnyRole(userRole, "ADMIN");
        Double latitude = body == null ? null : parseOptionalDouble(body.get("latitude"));
        Double longitude = body == null ? null : parseOptionalDouble(body.get("longitude"));
        return demandService.promotePublicAndConvert(id, adminId, adminEmail, latitude, longitude);
    }

    // ── ADMIN: send client invitation ───────────────────────────────────────

    @PostMapping("/{id}/send-invitation")
    public Map<String, String> sendInvitation(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody InvitationRequest request) {

        accessControlService.requireAnyRole(userRole, "ADMIN");

        DemandDTO demand = demandService.getDemandById(id);
        Long projectId = request.getProjectId() != null ? request.getProjectId() : demand.getProjectId();
        if (projectId == null) {
            return Map.of("success", "false", "message", "Aucun projet associé à cette demande");
        }

        try {
            demandService.resendInvitation(id, projectId, request.getMessage());

            log.info("Invitation sent for demand {} via email: {}, sms: {}",
                     id, request.getSendEmail(), request.getSendSms());

            return Map.of("success", "true", "message", "Invitation envoyée avec succès");

        } catch (RuntimeException e) {
            log.error("Invitation failed for demand {}: {}", id, e.getMessage());
            return Map.of("success", "false", "message", e.getMessage());
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Double parseOptionalDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        String asText = value.toString().trim();
        if (asText.isEmpty()) return null;
        return Double.valueOf(asText);
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> type, String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Enum.valueOf(type, raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            log.warn("Unknown {} value '{}', ignoring filter", type.getSimpleName(), raw);
            return null;
        }
    }
}
