package com.solarease.service;

import com.solarease.dto.FieldUpdateCreateRequest;
import com.solarease.dto.FieldUpdateDTO;
import com.solarease.entity.FieldUpdateEntity;
import com.solarease.entity.Project;
import com.solarease.enums.InstallationPhase;
import com.solarease.enums.InstallerFieldStatus;
import com.solarease.enums.ProjectStatus;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.FieldUpdateRepository;
import com.solarease.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FieldUpdateService {

    private final FieldUpdateRepository fieldUpdateRepository;
    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationWebSocketService notificationService;

    // ── Installer: create a new field update ─────────────────────────────────

    @Transactional
    public FieldUpdateDTO createFieldUpdate(Long projectId,
                                            String installerId,
                                            String installerEmail,
                                            FieldUpdateCreateRequest request) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        List<String> completedSteps = sanitizeSteps(request.getCompletedSteps());
        Integer progressPercent = computeProgress(completedSteps, request.getProgressPercent());
        InstallationPhase currentPhase = lastCompletedPhase(completedSteps);

        // Auto-flag blockage when a structured type is provided
        boolean blockage = Boolean.TRUE.equals(request.getIsBlockage())
                || request.getBlockageType() != null
                || InstallerFieldStatus.BLOCAGE.equals(request.getFieldStatus());

        FieldUpdateEntity entity = FieldUpdateEntity.builder()
                .projectId(projectId)
                .installerId(installerId)
                .installerEmail(installerEmail)
                .fieldStatus(request.getFieldStatus())
                .progressPercent(progressPercent)
                .note(request.getNote())
                .isBlockage(blockage)
                .blockageReason(request.getBlockageReason())
                .requiresAdminValidation(Boolean.TRUE.equals(request.getRequiresAdminValidation()))
                .completedSteps(completedSteps.isEmpty() ? null : completedSteps)
                .currentPhase(currentPhase)
                .blockageType(request.getBlockageType())
                .blockageImpact(request.getBlockageImpact())
                .photoUrl(request.getPhotoUrl())
                .build();

        FieldUpdateEntity saved = fieldUpdateRepository.save(entity);

        // Denormalise latest progress, status and phase onto the project
        project.setCurrentProgress(saved.getProgressPercent());
        project.setCurrentFieldStatus(saved.getFieldStatus());
        if (currentPhase != null) {
            project.setCurrentPhase(currentPhase);
        }
        autoAdvanceProjectStatus(project, saved, completedSteps);
        projectRepository.save(project);

        FieldUpdateDTO dto = toDTO(saved);

        // Push real-time event to all subscribers of this project's topic
        try {
            messagingTemplate.convertAndSend("/topic/field-updates/" + projectId, dto);
        } catch (Exception e) {
            log.warn("WebSocket push failed for project {}: {}", projectId, e.getMessage());
        }
        broadcastProjectLiveUpdate(project);

        // Notify the admin who assigned the project (or use a broadcast)
        String adminId = project.getAssignedByAdminId();
        if (adminId != null && !adminId.isBlank()) {
            String message = buildAdminNotification(project.getName(), installerEmail, saved);
            notificationService.notifyUser(adminId, "Mise à jour terrain", message);
        }

        notifyClientFieldUpdate(project, saved);

        log.info("Field update {} created for project {} by installer {}", saved.getId(), projectId, installerId);
        return dto;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<FieldUpdateDTO> getFieldUpdates(Long projectId) {
        return fieldUpdateRepository.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public FieldUpdateDTO getLatestFieldUpdate(Long projectId) {
        return fieldUpdateRepository.findFirstByProjectIdOrderByCreatedAtDesc(projectId)
                .map(this::toDTO)
                .orElse(null);
    }

    // ── Admin: validate or reject a field update ──────────────────────────────

    @Transactional
    public FieldUpdateDTO validateFieldUpdate(Long updateId,
                                              String adminId,
                                              String adminEmail,
                                              boolean validated,
                                              String adminNote) {
        FieldUpdateEntity entity = fieldUpdateRepository.findById(updateId)
                .orElseThrow(() -> new ResourceNotFoundException("FieldUpdate not found: " + updateId));

        entity.setAdminValidated(validated);
        entity.setAdminNote(adminNote);
        entity.setValidatedByAdminId(adminId);
        entity.setValidatedByAdminEmail(adminEmail);
        entity.setValidatedAt(LocalDateTime.now());

        FieldUpdateEntity saved = fieldUpdateRepository.save(entity);
        FieldUpdateDTO dto = toDTO(saved);

        try {
            messagingTemplate.convertAndSend("/topic/field-updates/" + entity.getProjectId(), dto);
        } catch (Exception e) {
            log.warn("WebSocket push failed for validation of update {}: {}", updateId, e.getMessage());
        }

        if (entity.getInstallerId() != null) {
            String action = validated ? "validée" : "rejetée";
            notificationService.notifyUser(entity.getInstallerId(),
                    "Mise à jour terrain " + action,
                    String.format("Votre mise à jour terrain (projet #%d) a été %s par l'admin.",
                            entity.getProjectId(), action));
        }

        return dto;
    }

    // ── Computation helpers (package-private for tests) ───────────────────────

    /**
     * Computes the progress percentage from a list of completed installation phases.
     * When the checklist is empty we fall back to the manual value (legacy clients).
     */
    static Integer computeProgress(List<String> completedSteps, Integer manualOverride) {
        if (completedSteps != null && !completedSteps.isEmpty()) {
            int total = InstallationPhase.values().length;
            return Math.min(100, completedSteps.size() * 100 / total);
        }
        return manualOverride != null ? manualOverride : 0;
    }

    /** Last phase ticked, in the canonical order defined by {@link InstallationPhase}. */
    static InstallationPhase lastCompletedPhase(List<String> completedSteps) {
        if (completedSteps == null || completedSteps.isEmpty()) return null;
        EnumSet<InstallationPhase> ticked = EnumSet.noneOf(InstallationPhase.class);
        for (String s : completedSteps) {
            try {
                ticked.add(InstallationPhase.valueOf(s));
            } catch (IllegalArgumentException ignored) {
                // unknown key — skip
            }
        }
        InstallationPhase last = null;
        for (InstallationPhase p : InstallationPhase.values()) {
            if (ticked.contains(p)) last = p;
        }
        return last;
    }

    /** Drops empty / unknown entries while preserving order and uniqueness. */
    static List<String> sanitizeSteps(List<String> in) {
        if (in == null || in.isEmpty()) return Collections.emptyList();
        List<String> out = new ArrayList<>();
        for (String s : in) {
            if (s == null || s.isBlank() || out.contains(s)) continue;
            try {
                InstallationPhase.valueOf(s);
                out.add(s);
            } catch (IllegalArgumentException ignored) {
                // unknown phase key — drop silently
            }
        }
        return out;
    }

    private String buildAdminNotification(String projectName, String installerEmail, FieldUpdateEntity saved) {
        if (Boolean.TRUE.equals(saved.getIsBlockage())) {
            StringBuilder sb = new StringBuilder("BLOCAGE sur le projet « ")
                    .append(projectName).append(" »");
            if (installerEmail != null) sb.append(" (installateur: ").append(installerEmail).append(")");
            if (saved.getBlockageType() != null) sb.append(". Type : ").append(saved.getBlockageType().label());
            if (saved.getBlockageImpact() != null) sb.append(" — impact ").append(saved.getBlockageImpact().label());
            if (saved.getBlockageReason() != null && !saved.getBlockageReason().isBlank()) {
                sb.append(". Motif : ").append(saved.getBlockageReason());
            }
            return sb.toString();
        }
        return String.format("Mise à jour terrain — projet « %s » : %s (%d %%)",
                projectName,
                fieldStatusLabel(saved.getFieldStatus() != null ? saved.getFieldStatus().name() : ""),
                saved.getProgressPercent() != null ? saved.getProgressPercent() : 0);
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private FieldUpdateDTO toDTO(FieldUpdateEntity e) {
        return FieldUpdateDTO.builder()
                .id(e.getId())
                .projectId(e.getProjectId())
                .installerId(e.getInstallerId())
                .installerEmail(e.getInstallerEmail())
                .fieldStatus(e.getFieldStatus() != null ? e.getFieldStatus().name() : null)
                .progressPercent(e.getProgressPercent())
                .note(e.getNote())
                .isBlockage(e.getIsBlockage())
                .blockageReason(e.getBlockageReason())
                .requiresAdminValidation(e.getRequiresAdminValidation())
                .adminValidated(e.getAdminValidated())
                .adminNote(e.getAdminNote())
                .validatedByAdminId(e.getValidatedByAdminId())
                .validatedByAdminEmail(e.getValidatedByAdminEmail())
                .validatedAt(e.getValidatedAt())
                .createdAt(e.getCreatedAt())
                .completedSteps(e.getCompletedSteps())
                .currentPhase(e.getCurrentPhase() != null ? e.getCurrentPhase().name() : null)
                .currentPhaseLabel(e.getCurrentPhase() != null ? e.getCurrentPhase().label() : null)
                .blockageType(e.getBlockageType() != null ? e.getBlockageType().name() : null)
                .blockageTypeLabel(e.getBlockageType() != null ? e.getBlockageType().label() : null)
                .blockageImpact(e.getBlockageImpact() != null ? e.getBlockageImpact().name() : null)
                .blockageImpactLabel(e.getBlockageImpact() != null ? e.getBlockageImpact().label() : null)
                .photoUrl(e.getPhotoUrl())
                .build();
    }

    private String fieldStatusLabel(String status) {
        return switch (status) {
            case "EN_DEPLACEMENT"  -> "En déplacement";
            case "SUR_SITE"        -> "Sur site";
            case "EN_INSTALLATION" -> "En installation";
            case "EN_PAUSE"        -> "En pause";
            case "FIN_CHANTIER"    -> "Fin de chantier";
            case "BLOCAGE"         -> "Blocage";
            default                -> status;
        };
    }

    private void notifyClientFieldUpdate(Project project, FieldUpdateEntity update) {
        if (project.getClientId() == null) {
            return;
        }
        clientRepository.findById(project.getClientId()).ifPresent(client -> {
            String userId = client.getUserId();
            if (userId == null || userId.isBlank()) {
                userId = String.valueOf(client.getId());
            }
            int pct = update.getProgressPercent() != null ? update.getProgressPercent() : 0;
            notificationService.notifyUser(
                    userId,
                    "Mise à jour chantier",
                    String.format("Votre projet « %s » progresse : %d%% accompli.", project.getName(), pct));
        });
    }

    /** Move project into IN_PROGRESS when installer starts field work. */
    private void autoAdvanceProjectStatus(Project project, FieldUpdateEntity update, List<String> completedSteps) {
        ProjectStatus status = project.getStatus();
        if (status == null || status == ProjectStatus.COMPLETED || status == ProjectStatus.CANCELLED) {
            return;
        }
        boolean fieldWorkStarted =
                !completedSteps.isEmpty()
                || (update.getProgressPercent() != null && update.getProgressPercent() > 0)
                || InstallerFieldStatus.EN_INSTALLATION.equals(update.getFieldStatus())
                || InstallerFieldStatus.SUR_SITE.equals(update.getFieldStatus())
                || InstallerFieldStatus.EN_DEPLACEMENT.equals(update.getFieldStatus())
                || InstallerFieldStatus.FIN_CHANTIER.equals(update.getFieldStatus());
        if (fieldWorkStarted && (status == ProjectStatus.CREATED
                || status == ProjectStatus.EN_PREPARATION
                || status == ProjectStatus.INSTALLATEUR_AFFECTE)) {
            project.setStatus(ProjectStatus.IN_PROGRESS);
        }
    }

    private void broadcastProjectLiveUpdate(Project project) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "PROJECT_UPDATED");
        payload.put("projectId", project.getId());
        payload.put("status", project.getStatus() != null ? project.getStatus().name() : null);
        payload.put("currentProgress", project.getCurrentProgress());
        payload.put("currentPhase", project.getCurrentPhase() != null ? project.getCurrentPhase().name() : null);
        payload.put("currentFieldStatus",
                project.getCurrentFieldStatus() != null ? project.getCurrentFieldStatus().name() : null);
        payload.put("timestamp", LocalDateTime.now().toString());
        try {
            messagingTemplate.convertAndSend("/topic/project-updates/" + project.getId(), payload);
        } catch (Exception e) {
            log.warn("Failed to broadcast project update for {}: {}", project.getId(), e.getMessage());
        }
    }
}
