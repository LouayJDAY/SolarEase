package com.solarease.service;

import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.entity.Project;
import com.solarease.enums.ProjectStatus;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private ProjectService projectService;

    private Project project;
    private ProjectRequest projectRequest;

    @BeforeEach
    void setUp() {
        project = Project.builder()
                .id(1L)
                .name("Solar Project 1")
                .description("Description")
                .clientId(1L)
                .status(ProjectStatus.CREATED)
                .build();

        projectRequest = ProjectRequest.builder()
                .name("Solar Project 1")
                .description("Description")
                .clientId(1L)
                .build();
    }

    @Test
    void createProject_Success() {
        when(clientRepository.existsById(1L)).thenReturn(true);
        when(projectRepository.save(any(Project.class))).thenReturn(project);

        ProjectResponse response = projectService.createProject(projectRequest);

        assertNotNull(response);
        assertEquals(project.getName(), response.getName());
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void createProject_ClientNotFound() {
        when(clientRepository.existsById(1L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> projectService.createProject(projectRequest));
        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void getProjectById_Success() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));

        ProjectResponse response = projectService.getProjectById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    void getProjectById_NotFound() {
        when(projectRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.getProjectById(1L));
    }

    @Test
    void getAllProjects_Success() {
        when(projectRepository.findAll()).thenReturn(Arrays.asList(project));

        List<ProjectResponse> responses = projectService.getAllProjects();

        assertFalse(responses.isEmpty());
        assertEquals(1, responses.size());
    }

    @Test
    void updateProject_Success() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenReturn(project);

        ProjectResponse response = projectService.updateProject(1L, projectRequest);

        assertNotNull(response);
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    void deleteProject_Success() {
        when(projectRepository.existsById(1L)).thenReturn(true);
        doNothing().when(projectRepository).deleteById(1L);

        projectService.deleteProject(1L);

        verify(projectRepository).deleteById(1L);
    }
}
