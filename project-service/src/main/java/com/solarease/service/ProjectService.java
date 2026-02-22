package com.solarease.service;

import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.entity.Project;
import com.solarease.enums.ProjectStatus;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;

    public ProjectResponse createProject(ProjectRequest request) {
        if (!clientRepository.existsById(request.getClientId())) {
            throw new ResourceNotFoundException("Client not found with id: " + request.getClientId());
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .clientId(request.getClientId())
                .status(ProjectStatus.CREATED)
                .build();

        return mapToResponse(projectRepository.save(project));
    }

    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToResponse(project);
    }

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsByClientId(Long clientId) {
        if (!clientRepository.existsById(clientId)) {
            throw new ResourceNotFoundException("Client not found with id: " + clientId);
        }
        return projectRepository.findByClientId(clientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse updateProjectStatus(Long id, String status) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        
        try {
            project.setStatus(ProjectStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid project status: " + status);
        }

        return mapToResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setLocation(request.getLocation());
        
        // Optionally update client if needed, but usually project transfer is a separate process
        if (request.getClientId() != null && !request.getClientId().equals(project.getClientId())) {
             if (!clientRepository.existsById(request.getClientId())) {
                throw new ResourceNotFoundException("Client not found with id: " + request.getClientId());
            }
            project.setClientId(request.getClientId());
        }

        return mapToResponse(projectRepository.save(project));
    }

    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
    }

    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .location(project.getLocation())
                .status(project.getStatus())
                .clientId(project.getClientId())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
