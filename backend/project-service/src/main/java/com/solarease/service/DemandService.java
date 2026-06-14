package com.solarease.service;

import com.solarease.dto.DemandCreateRequest;
import com.solarease.dto.DemandDTO;
import com.solarease.dto.PublicDemandCreateRequest;
import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.entity.Client;
import com.solarease.entity.DemandEntity;
import com.solarease.enums.DemandPriority;
import com.solarease.enums.DemandSource;
import com.solarease.enums.DemandStatus;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.DemandRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemandService {

    private final DemandRepository demandRepository;
    private final ProjectService projectService;
    private final ClientRepository clientRepository;
    private final NotificationWebSocketService notificationService;
    private final InvitationService invitationService;
    private final IdentityServiceClient identityServiceClient;

    // ── CLIENT: submit a new demand ──────────────────────────────────────────

    @Transactional
    public DemandDTO createDemand(
            String clientUserId,
            String clientEmail,
            String clientFirstName,
            String clientLastName,
            DemandCreateRequest req) {

        DemandEntity entity = DemandEntity.builder()
                .clientUserId(clientUserId)
                .clientEmail(clientEmail)
                .clientFirstName(clientFirstName)
                .clientLastName(clientLastName)
                .status(DemandStatus.NOUVELLE)
                .source(DemandSource.CLIENT)
                .priority(DemandPriority.NORMALE)
                .name(req.getName())
                .description(req.getDescription())
                .location(req.getLocation())
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .peakPower(req.getPeakPower())
                .availableArea(req.getAvailableArea())
                .inclination(req.getInclination())
                .orientation(req.getOrientation())
                .budget(req.getBudget())
                .build();

        DemandEntity saved = demandRepository.save(entity);
        DemandDTO dto = toDto(saved);
        notificationService.notifyAdminsOnNewDemand(dto);
        return dto;
    }

    @Transactional
    public DemandDTO createPublicDemand(PublicDemandCreateRequest req) {
        String fullName = req.getFullName() == null ? "" : req.getFullName().trim();
        String[] names = splitFullName(fullName);

        String subjectLabel = mapSubject(req.getSubject());
        String demandName = "Demande " + subjectLabel + " - " + (names[0].isBlank() ? "Prospect" : names[0]);
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);

        StringBuilder description = new StringBuilder();
        if (req.getMessage() != null && !req.getMessage().isBlank()) {
            description.append(req.getMessage().trim());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            if (!description.isEmpty()) {
                description.append("\n\n");
            }
            description.append("Téléphone: ").append(req.getPhone().trim());
        }

        DemandEntity entity = DemandEntity.builder()
                .clientUserId("PUBLIC:" + email)
                .clientEmail(email)
                .clientFirstName(names[0])
                .clientLastName(names[1])
                .clientPhone(req.getPhone())
                .status(DemandStatus.NOUVELLE)
                .source(DemandSource.PUBLIC)
                .priority(DemandPriority.NORMALE)
                .name(demandName)
                .description(description.toString())
                .build();

        DemandEntity saved = demandRepository.save(entity);
        DemandDTO dto = toDto(saved);
        notificationService.notifyAdminsOnNewDemand(dto);
        return dto;
    }

    // ── CLIENT: list own demands ─────────────────────────────────────────────

    public Page<DemandDTO> getMyDemands(String clientUserId, Pageable pageable) {
        return demandRepository.findByClientUserId(clientUserId, pageable).map(this::toDto);
    }

    // ── ADMIN: list / search demands ─────────────────────────────────────────

    public Page<DemandDTO> getAllDemands(Pageable pageable) {
        return demandRepository.findAll(pageable).map(this::toDto);
    }

    public Page<DemandDTO> getDemandsByStatus(DemandStatus status, Pageable pageable) {
        return demandRepository.findByStatus(status, pageable).map(this::toDto);
    }

    /** Inbox-grade search supporting optional status, source and free-text query. */
    public Page<DemandDTO> searchDemands(DemandStatus status,
                                         DemandSource source,
                                         String q,
                                         Pageable pageable) {
        String normalisedQ = (q == null || q.isBlank()) ? null : q.trim();
        return demandRepository.search(status, source, normalisedQ, pageable).map(this::toDto);
    }

    public DemandDTO getDemandById(Long demandId) {
        return demandRepository.findById(demandId)
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Demand not found: " + demandId));
    }

    // ── ADMIN: change status ──────────────────────────────────────────────────

    @Transactional
    public DemandDTO updateStatus(Long demandId, DemandStatus newStatus, String adminNote, String rejectionReason) {
        DemandEntity demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Demand not found: " + demandId));
        DemandStatus previousStatus = demand.getStatus();
        demand.setStatus(newStatus);
        if (adminNote != null) demand.setAdminNote(adminNote);
        if (rejectionReason != null) demand.setRejectionReason(rejectionReason);
        DemandEntity saved = demandRepository.save(demand);
        DemandDTO dto = toDto(saved);
        if (previousStatus != newStatus) {
            notificationService.notifyDemandStatusChange(dto);
            notificationService.notifyAdminDashboardRefresh("DEMAND_STATUS_CHANGED");
        }
        return dto;
    }

    // ── ADMIN: assign / unassign ──────────────────────────────────────────────

    @Transactional
    public DemandDTO assignDemand(Long demandId, String adminId) {
        DemandEntity demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Demand not found: " + demandId));
        demand.setAssignedAdminId(adminId == null || adminId.isBlank() ? null : adminId);
        return toDto(demandRepository.save(demand));
    }

    @Transactional
    public DemandDTO updatePriority(Long demandId, DemandPriority priority) {
        DemandEntity demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Demand not found: " + demandId));
        demand.setPriority(priority == null ? DemandPriority.NORMALE : priority);
        return toDto(demandRepository.save(demand));
    }

    // ── ADMIN: convert demand to project ─────────────────────────────────────

    /**
     * Full conversion: admin supplies the target clientId (project-service client record).
     */
    @Transactional
    public ProjectResponse convertToProject(
            Long demandId,
            Long clientId,
            String adminId,
            String adminEmail,
            Double latitude,
            Double longitude) {
        DemandEntity demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Demand not found: " + demandId));

        if (demand.getProjectId() != null) {
            throw new IllegalStateException("Demand " + demandId + " has already been converted to project " + demand.getProjectId());
        }

        Double effectiveLatitude = latitude != null ? latitude : demand.getLatitude();
        Double effectiveLongitude = longitude != null ? longitude : demand.getLongitude();

        ProjectRequest projectReq = ProjectRequest.builder()
                .name(demand.getName())
                .description(demand.getDescription())
                .location(demand.getLocation())
            .latitude(effectiveLatitude)
            .longitude(effectiveLongitude)
                .peakPower(demand.getPeakPower())
                .availableArea(demand.getAvailableArea())
                .inclination(demand.getInclination())
                .orientation(demand.getOrientation())
                .budget(demand.getBudget())
                .clientId(clientId)
                .build();

        ProjectResponse project = projectService.createProject(adminId, adminEmail, adminId, adminEmail, projectReq);

        if (latitude != null) {
            demand.setLatitude(latitude);
        }
        if (longitude != null) {
            demand.setLongitude(longitude);
        }
        demand.setProjectId(project.getId());
        demand.setStatus(DemandStatus.VALIDEE);
        demandRepository.save(demand);

        DemandDTO dto = toDto(demand);
        notificationService.notifyDemandStatusChange(dto);

        log.info("Demand {} converted to project {}", demandId, project.getId());
        return project;
    }

    /**
     * Convenience flow for PUBLIC prospects: create an items_client row from the
     * demand fields (or reuse an existing client with the same email), then
     * convert. Returns the newly-created project.
     */
    @Transactional
    public ProjectResponse promotePublicAndConvert(
            Long demandId,
            String adminId,
            String adminEmail,
            Double latitude,
            Double longitude) {

        DemandEntity demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Demand not found: " + demandId));

        String email = demand.getClientEmail();
        if (email == null || email.isBlank()) {
            throw new IllegalStateException("Cannot promote a public demand without a client email");
        }
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);

        java.util.Optional<Client> existingClient = clientRepository.findByEmail(normalizedEmail);
        if (existingClient.isEmpty()) {
            existingClient = clientRepository.findByEmail(email);
        }

        Long clientId = existingClient
                .map(Client::getId)
                .orElseGet(() -> {
                    Client created = Client.builder()
                            .firstName(safe(demand.getClientFirstName(), "Prospect"))
                            .lastName(safe(demand.getClientLastName(), "Public"))
                            .email(normalizedEmail)
                            .phoneNumber(demand.getClientPhone())
                            .address(demand.getLocation())
                            .installerId(adminId)
                            .build();
                    Client saved = clientRepository.save(created);
                    log.info("Promoted public demand {} to new client {}", demandId, saved.getId());
                    return saved.getId();
                });

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + clientId));

        ProjectResponse project = convertToProject(demandId, clientId, adminId, adminEmail, latitude, longitude);

        if (client.getUserId() == null || client.getUserId().isBlank()) {
            DemandEntity refreshed = demandRepository.findById(demandId)
                    .orElseThrow(() -> new ResourceNotFoundException("Demand not found: " + demandId));
            invitationService.sendInvitationForDemand(refreshed, client, project.getId());
            project.setInvitationSent(true);
            boolean hasAccount = identityServiceClient.emailHasPortalAccount(client.getEmail());
            // #region agent log
            com.solarease.debug.DebugTrace.log("H1-H4", "DemandService.promotePublicAndConvert",
                    "after invitation send",
                    java.util.Map.of(
                            "clientId", clientId,
                            "clientUserId", "null",
                            "identityHasAccount", hasAccount,
                            "projectId", project.getId(),
                            "emailDomain", email.contains("@") ? email.substring(email.indexOf('@')) : "unknown"
                    ));
            // #endregion
            project.setInvitationMessage(hasAccount
                    ? "Lien de connexion envoyé à " + client.getEmail() + " (compte existant)"
                    : "Invitation inscription envoyée à " + client.getEmail());
        } else {
            project.setInvitationSent(false);
            project.setInvitationMessage("Le client possède déjà un compte portail");
        }

        return project;
    }

    @Transactional
    public void resendInvitation(Long demandId, Long projectId, String message) {
        DemandEntity demand = demandRepository.findById(demandId)
                .orElseThrow(() -> new ResourceNotFoundException("Demand not found: " + demandId));
        Long effectiveProjectId = projectId != null ? projectId : demand.getProjectId();
        if (effectiveProjectId == null) {
            throw new IllegalStateException("Aucun projet associé à cette demande");
        }
        invitationService.resendInvitationForDemand(demand, effectiveProjectId, message);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private DemandDTO toDto(DemandEntity e) {
        Boolean clientHasAccount = null;
        if (e.getClientEmail() != null && !e.getClientEmail().isBlank()) {
            clientHasAccount = clientRepository.findByEmail(e.getClientEmail().trim().toLowerCase(Locale.ROOT))
                    .map(c -> c.getUserId() != null && !c.getUserId().isBlank())
                    .orElse(false);
        }

        java.util.Optional<java.time.LocalDateTime> sentAt = invitationService.latestInvitationSentAt(e.getId());

        return DemandDTO.builder()
                .id(e.getId())
                .clientUserId(e.getClientUserId())
                .clientEmail(e.getClientEmail())
                .clientFirstName(e.getClientFirstName())
                .clientLastName(e.getClientLastName())
                .clientPhone(e.getClientPhone())
                .status(e.getStatus())
                .source(e.getSource())
                .priority(e.getPriority())
                .assignedAdminId(e.getAssignedAdminId())
                .name(e.getName())
                .description(e.getDescription())
                .location(e.getLocation())
                .latitude(e.getLatitude())
                .longitude(e.getLongitude())
                .peakPower(e.getPeakPower())
                .availableArea(e.getAvailableArea())
                .inclination(e.getInclination())
                .orientation(e.getOrientation())
                .budget(e.getBudget())
                .rejectionReason(e.getRejectionReason())
                .adminNote(e.getAdminNote())
                .projectId(e.getProjectId())
                .clientHasAccount(clientHasAccount)
                .invitationSent(sentAt.isPresent())
                .invitationSentAt(sentAt.orElse(null))
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private String[] splitFullName(String fullName) {
        if (fullName.isBlank()) {
            return new String[]{"", ""};
        }
        String[] parts = fullName.split("\\s+");
        if (parts.length == 1) {
            return new String[]{parts[0], ""};
        }
        String firstName = parts[0];
        String lastName = String.join(" ", java.util.Arrays.copyOfRange(parts, 1, parts.length));
        return new String[]{firstName, lastName};
    }

    private String mapSubject(String subject) {
        if (subject == null) return "devis";
        return switch (subject.trim().toLowerCase(Locale.ROOT)) {
            case "devis" -> "devis";
            case "info" -> "information";
            case "sav" -> "SAV";
            default -> "autre";
        };
    }

    private static String safe(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value.trim();
    }
}
