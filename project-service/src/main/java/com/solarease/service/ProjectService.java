package com.solarease.service;

import com.solarease.dto.DashboardStatsResponse;
import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.entity.Project;
import com.solarease.enums.ProjectStatus;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;

    // ── Create ───────────────────────────────────────────────────────────────

    public ProjectResponse createProject(String installerId, ProjectRequest request) {
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
                .status(ProjectStatus.CREATED)
                .build();

        log.info("Creating project '{}' for installer {}", request.getName(), installerId);
        return mapToResponse(projectRepository.save(project));
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
        return projectRepository.findByInstallerIdWithFilters(installerId, status, search, pageable)
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

    // ── Update ───────────────────────────────────────────────────────────────

    @Transactional
    public ProjectResponse updateProjectStatus(Long id, String status) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        
        try {
            project.setStatus(ProjectStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid project status: " + status +
                    ". Allowed values: CREATED, IN_PROGRESS, COMPLETED, CANCELLED");
        }

        log.info("Updated project {} status to {}", id, status);
        return mapToResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

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

        log.info("Updated project {}", id);
        return mapToResponse(projectRepository.save(project));
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
        log.info("Deleted project {}", id);
    }

    // ── Dashboard Statistics ─────────────────────────────────────────────────

    public DashboardStatsResponse getDashboardStats(String installerId) {
        log.debug("Calculating dashboard stats for installer {}", installerId);
        return DashboardStatsResponse.builder()
                .totalProjects(projectRepository.countByInstallerId(installerId))
                .totalClients(projectRepository.countDistinctClientsByInstallerId(installerId))
                .projectsCreated(projectRepository.countByInstallerIdAndStatus(installerId, ProjectStatus.CREATED))
                .projectsInProgress(projectRepository.countByInstallerIdAndStatus(installerId, ProjectStatus.IN_PROGRESS))
                .projectsCompleted(projectRepository.countByInstallerIdAndStatus(installerId, ProjectStatus.COMPLETED))
                .projectsCancelled(projectRepository.countByInstallerIdAndStatus(installerId, ProjectStatus.CANCELLED))
                .build();
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
                .client(clientInfo)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
