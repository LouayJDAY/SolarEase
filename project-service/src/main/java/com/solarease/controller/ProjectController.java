package com.solarease.controller;

import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse createProject(@RequestBody @Valid ProjectRequest request) {
        return projectService.createProject(request);
    }

    @GetMapping
    public List<ProjectResponse> getAllProjects() {
        return projectService.getAllProjects();
    }

    @GetMapping("/{id}")
    public ProjectResponse getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }

    @GetMapping("/client/{clientId}")
    public List<ProjectResponse> getProjectsByClientId(@PathVariable Long clientId) {
        return projectService.getProjectsByClientId(clientId);
    }

    @PatchMapping("/{id}/status")
    public ProjectResponse updateProjectStatus(@PathVariable Long id, @RequestParam String status) {
        return projectService.updateProjectStatus(id, status);
    }
}
