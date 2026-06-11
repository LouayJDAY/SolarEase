package com.solarease.service;

import com.solarease.dto.DashboardStatsResponse;
import com.solarease.dto.MonthlyCountDto;
import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.entity.InvoiceEntity;
import com.solarease.entity.Project;
import com.solarease.enums.ProjectStatus;
import com.solarease.repository.InvoiceRepository;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;
    private final N8nInvoiceWebhookService n8nInvoiceWebhookService;
    private final com.solarease.repository.DemandRepository demandRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final NotificationWebSocketService notificationWebSocketService;

    // ── Create ───────────────────────────────────────────────────────────────

    public ProjectResponse createProject(String installerId, ProjectRequest request) {
        return createProject(installerId, null, null, null, request);
    }

    public ProjectResponse createProject(
            String installerId,
            String installerEmail,
            String assignedByAdminId,
            String assignedByAdminEmail,
            ProjectRequest request) {
        if (!clientRepository.existsById(request.getClientId())) {
            throw new ResourceNotFoundException("Client not found with id: " + request.getClientId());
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .peakPower(request.getPeakPower())
                .availableArea(request.getAvailableArea())
                .inclination(request.getInclination())
                .orientation(request.getOrientation())
                .budget(request.getBudget())
                .clientId(request.getClientId())
                .installerId(installerId)
                .installerEmail(installerEmail)
                .assignedByAdminId(assignedByAdminId)
                .assignedByAdminEmail(assignedByAdminEmail)
                .status(ProjectStatus.CREATED)
                .build();

        log.info("Creating project '{}' for installer {}", request.getName(), installerId);
        Project saved = projectRepository.save(project);
        // notify client project count
        if (saved.getClientId() != null) {
            sendClientProjectCountUpdate(saved.getClientId());
        }
        notificationWebSocketService.notifyDashboardRefresh("PROJECT_CREATED", saved.getInstallerId());
        return mapToResponse(saved);
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToResponse(project);
    }

    public Page<ProjectResponse> getProjectsByInstaller(String installerId, ProjectStatus status,
                                                         String search, Pageable pageable) {
        log.debug("Fetching projects for installer {} with status={}, search={}", installerId, status, search);
        return projectRepository.findAssignedByAdminIdWithFilters(installerId, status, search, pageable)
                .map(this::mapToResponse);
    }

    public Page<ProjectResponse> getAllProjects(ProjectStatus status, String search, Pageable pageable) {
        log.debug("Fetching all projects with status={}, search={}", status, search);
        return projectRepository.findAllWithFilters(status, search, pageable)
                .map(this::mapToResponse);
    }

    public List<ProjectResponse> getProjectsByClientId(Long clientId) {
        if (!clientRepository.existsById(clientId)) {
            throw new ResourceNotFoundException("Client not found with id: " + clientId);
        }
        return projectRepository.findByClientId(clientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsByClientUserId(String userId) {
        log.debug("Fetching projects for client userId={}", userId);
        return clientRepository.findByUserId(userId)
                .map(client -> projectRepository.findByClientId(client.getId()).stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @Transactional
    public ProjectResponse updateProjectStatus(Long id, String status) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        
        try {
            project.setStatus(ProjectStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid project status: " + status +
                    ". Allowed values: CREATED, EN_PREPARATION, INSTALLATEUR_AFFECTE, IN_PROGRESS, COMPLETED, CANCELLED");
        }

        log.info("Updated project {} status to {}", id, status);
        Project saved = projectRepository.save(project);

        if (ProjectStatus.COMPLETED.equals(saved.getStatus())) {
            invoiceRepository.findByProject_Id(saved.getId()).stream()
                    .max(Comparator.comparing(InvoiceEntity::getId))
                    .ifPresent(inv -> n8nInvoiceWebhookService.notifyInvoiceReady(inv, "project.completed"));
        }

        notificationWebSocketService.notifyDashboardRefresh("PROJECT_STATUS_CHANGED", saved.getInstallerId());
        broadcastProjectLiveUpdate(saved);
        notifyClientProjectChanged(saved);
        return mapToResponse(saved);
    }

        @Transactional
        public ProjectResponse updateProject(
            Long id,
            String userRole,
            String currentUserId,
            String currentUserEmail,
            ProjectRequest request) {
            log.debug("updateProject called: id={}, userRole={}, currentUserId={}, request={}", id, userRole, currentUserId, request);

            Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
            Long originalClientId = project.getClientId();

            log.debug("Existing project before update: id={}, installerId={}, installerEmail={}, clientId={}",
                project.getId(), project.getInstallerId(), project.getInstallerEmail(), project.getClientId());

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setLocation(request.getLocation());
        project.setLatitude(request.getLatitude());
        project.setLongitude(request.getLongitude());
        project.setPeakPower(request.getPeakPower());
        project.setAvailableArea(request.getAvailableArea());
        project.setInclination(request.getInclination());
        project.setOrientation(request.getOrientation());
        project.setBudget(request.getBudget());
        
        if (request.getClientId() != null && !request.getClientId().equals(project.getClientId())) {
             if (!clientRepository.existsById(request.getClientId())) {
                throw new ResourceNotFoundException("Client not found with id: " + request.getClientId());
            }
            project.setClientId(request.getClientId());
        }

        boolean canReassignInstaller = "ADMIN".equalsIgnoreCase(userRole);
        if (canReassignInstaller && request.getInstallerId() != null && !request.getInstallerId().isBlank()) {
            project.setInstallerId(request.getInstallerId());
            project.setInstallerEmail(request.getInstallerEmail());
            project.setAssignedByAdminId(currentUserId);
            project.setAssignedByAdminEmail(currentUserEmail);
        }

        log.info("Updated project {}", id);
        Project saved = projectRepository.save(project);
        // If client assignment changed, notify counts for both old and new client
        Long newClientId = saved.getClientId();
        if (originalClientId != null && !originalClientId.equals(newClientId)) {
            sendClientProjectCountUpdate(originalClientId);
        }
        if (newClientId != null) {
            sendClientProjectCountUpdate(newClientId);
        }
        notificationWebSocketService.notifyDashboardRefresh("PROJECT_UPDATED", saved.getInstallerId());
        broadcastProjectLiveUpdate(saved);
        return mapToResponse(saved);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        // fetch project to get clientId before deletion
        Project project = projectRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        Long clientId = project.getClientId();
        projectRepository.deleteById(id);
        log.info("Deleted project {}", id);
        if (clientId != null) {
            sendClientProjectCountUpdate(clientId);
        }
        notificationWebSocketService.notifyDashboardRefresh("PROJECT_DELETED", project.getInstallerId());
    }

    private void sendClientProjectCountUpdate(Long clientId) {
        try {
            long count = projectRepository.countByClientId(clientId);
            messagingTemplate.convertAndSend("/topic/client-project-counts", Map.of(
                    "clientId", clientId,
                    "projectCount", count
            ));
        } catch (Exception e) {
            log.warn("Failed to send client project count update for client {}: {}", clientId, e.getMessage());
        }
    }

    /** STOMP push so client detail pages refresh stepper / status without reload. */
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

    private void notifyClientProjectChanged(Project project) {
        resolveClientUserId(project.getClientId()).ifPresent(userId -> {
            String status = project.getStatus() != null ? project.getStatus().name() : "UPDATED";
            notificationWebSocketService.notifyProjectStatusChanged(userId, project.getName(), status);
        });
    }

    private Optional<String> resolveClientUserId(Long clientId) {
        if (clientId == null) {
            return Optional.empty();
        }
        return clientRepository.findById(clientId)
                .map(c -> c.getUserId() != null && !c.getUserId().isBlank()
                        ? c.getUserId()
                        : String.valueOf(clientId));
    }

    // ── Dashboard Statistics ─────────────────────────────────────────────────

    public DashboardStatsResponse getDashboardStats(String installerId) {
        if (installerId == null) {
            log.debug("Calculating global dashboard stats for admin");
            long pendingDemands = demandRepository.countByStatus(com.solarease.enums.DemandStatus.NOUVELLE);
            long newToday = demandRepository.countByCreatedAtAfter(java.time.LocalDate.now().atStartOfDay());
            return DashboardStatsResponse.builder()
                    .totalProjects(projectRepository.count())
                    .totalClients(projectRepository.countDistinctClients())
                    .projectsCreated(projectRepository.countByStatus(ProjectStatus.CREATED))
                    .projectsInProgress(projectRepository.countByStatus(ProjectStatus.IN_PROGRESS))
                    .projectsCompleted(projectRepository.countByStatus(ProjectStatus.COMPLETED))
                    .projectsCancelled(projectRepository.countByStatus(ProjectStatus.CANCELLED))
                    .pendingDemandsCount(pendingDemands)
                    .newDemandsTodayCount(newToday)
                    .projectsByMonth(buildProjectsByMonth(null))
                    .build();
        }

        // Return stats for specific INSTALLER
        log.debug("Calculating dashboard stats for installer {}", installerId);
        return DashboardStatsResponse.builder()
            .totalProjects(projectRepository.countByInstallerIdAndAssignedByAdminIdIsNotNull(installerId))
            .totalClients(projectRepository.countDistinctClientsByInstallerIdAndAssignedByAdminIdIsNotNull(installerId))
            .projectsCreated(projectRepository.countByInstallerIdAndAssignedByAdminIdIsNotNullAndStatus(installerId, ProjectStatus.CREATED))
            .projectsInProgress(projectRepository.countByInstallerIdAndAssignedByAdminIdIsNotNullAndStatus(installerId, ProjectStatus.IN_PROGRESS))
            .projectsCompleted(projectRepository.countByInstallerIdAndAssignedByAdminIdIsNotNullAndStatus(installerId, ProjectStatus.COMPLETED))
            .projectsCancelled(projectRepository.countByInstallerIdAndAssignedByAdminIdIsNotNullAndStatus(installerId, ProjectStatus.CANCELLED))
            // Demands are admin-only; installer-scoped stats leave the demand counters at 0.
            .pendingDemandsCount(0)
            .newDemandsTodayCount(0)
            .projectsByMonth(buildProjectsByMonth(installerId))
                .build();
    }

    private List<MonthlyCountDto> buildProjectsByMonth(String installerId) {
        YearMonth current = YearMonth.now();
        YearMonth start = current.minusMonths(11);
        LocalDateTime startDate = start.atDay(1).atStartOfDay();

        List<Object[]> rows = installerId == null
                ? projectRepository.countProjectsByMonthSince(startDate)
                : projectRepository.countProjectsByMonthForInstallerSince(installerId, startDate);

        Map<YearMonth, Long> countMap = new HashMap<>();
        for (Object[] row : rows) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            long count = ((Number) row[2]).longValue();
            countMap.put(YearMonth.of(year, month), count);
        }

        List<MonthlyCountDto> result = new ArrayList<>();
        for (YearMonth ym = start; !ym.isAfter(current); ym = ym.plusMonths(1)) {
            result.add(MonthlyCountDto.builder()
                    .year(ym.getYear())
                    .month(ym.getMonthValue())
                    .count(countMap.getOrDefault(ym, 0L))
                    .build());
        }
        return result;
    }

    // ── Mapping ──────────────────────────────────────────────────────────────

    private ProjectResponse mapToResponse(Project project) {
        ProjectResponse.ClientInfo clientInfo = null;
        if (project.getClientId() != null) {
            clientInfo = clientRepository.findById(project.getClientId())
                    .map(c -> ProjectResponse.ClientInfo.builder()
                            .id(c.getId())
                            .firstName(c.getFirstName())
                            .lastName(c.getLastName())
                            .build())
                    .orElse(null);
        }

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .location(project.getLocation())
                .latitude(project.getLatitude())
                .longitude(project.getLongitude())
                .peakPower(project.getPeakPower())
                .availableArea(project.getAvailableArea())
                .inclination(project.getInclination())
                .orientation(project.getOrientation())
                .budget(project.getBudget())
                .status(project.getStatus())
                .clientId(project.getClientId())
                .installerId(project.getInstallerId())
                .installerEmail(project.getInstallerEmail())
                .assignedByAdminId(project.getAssignedByAdminId())
                .assignedByAdminEmail(project.getAssignedByAdminEmail())
                .currentProgress(project.getCurrentProgress())
                .currentFieldStatus(project.getCurrentFieldStatus() != null
                        ? project.getCurrentFieldStatus().name() : null)
                .currentPhase(project.getCurrentPhase() != null
                        ? project.getCurrentPhase().name() : null)
                .currentPhaseLabel(project.getCurrentPhase() != null
                        ? project.getCurrentPhase().label() : null)
                .client(clientInfo)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
