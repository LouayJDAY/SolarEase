package com.solarease.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.enums.ProjectStatus;
import com.solarease.service.AccessControlService;
import com.solarease.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private AccessControlService accessControlService;

    @Autowired
    private ObjectMapper objectMapper;

    private ProjectResponse projectResponse;
    private ProjectRequest projectRequest;

    @BeforeEach
    void setUp() {
        projectResponse = ProjectResponse.builder()
                .id(1L)
                .name("Test Project")
                .description("Desc")
                .clientId(1L)
                .status(ProjectStatus.CREATED)
                .build();

        projectRequest = ProjectRequest.builder()
                .name("Test Project")
                .description("Desc")
                .clientId(1L)
                .build();
    }

    @Test
    void createProject_Success() throws Exception {
        when(projectService.createProject(any(ProjectRequest.class))).thenReturn(projectResponse);

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("Test Project"));
    }

    @Test
    void getAllProjects_Success() throws Exception {
        when(projectService.getAllProjects()).thenReturn(Collections.singletonList(projectResponse));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void getProjectById_Success() throws Exception {
        when(projectService.getProjectById(1L)).thenReturn(projectResponse);

        mockMvc.perform(get("/api/projects/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void updateProject_Success() throws Exception {
        when(projectService.updateProject(eq(1L), any(ProjectRequest.class))).thenReturn(projectResponse);

        mockMvc.perform(put("/api/projects/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projectRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Project"));
    }

    @Test
    void deleteProject_Success() throws Exception {
        doNothing().when(projectService).deleteProject(1L);

        mockMvc.perform(delete("/api/projects/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void createProject_Returns400WithFields_WhenNameBlank() throws Exception {
        ProjectRequest invalid = ProjectRequest.builder()
                .name("")
                .clientId(1L)
                .build();

        mockMvc.perform(post("/api/projects")
                        .header("X-User-Id", "installer-1")
                        .header("X-User-Role", "INSTALLER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.name").exists());
    }
}
