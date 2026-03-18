package com.solarease.controller;

import com.solarease.dto.DashboardStatsResponse;
import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.enums.ProjectStatus;
import com.solarease.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // ── Create ───────────────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse createProject(
            @RequestHeader("X-User-Id") String installerId,
            @RequestBody @Valid ProjectRequest request) {
        return projectService.createProject(installerId, request);
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    @GetMapping
    public Page<ProjectResponse> getMyProjects(
            @RequestHeader("X-User-Id") String installerId,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return projectService.getProjectsByInstaller(installerId, status, search, pageable);
    }

    @GetMapping("/{id}")
    public ProjectResponse getProjectById(@PathVariable Long id) {
        return projectService.getProjectById(id);
    }

    @GetMapping("/client/{clientId}")
    public List<ProjectResponse> getProjectsByClientId(@PathVariable Long clientId) {
        return projectService.getProjectsByClientId(clientId);
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    public DashboardStatsResponse getDashboardStats(
            @RequestHeader("X-User-Id") String installerId) {
        return projectService.getDashboardStats(installerId);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    public ProjectResponse updateProjectStatus(@PathVariable Long id, @RequestParam String status) {
        return projectService.updateProjectStatus(id, status);
    }

    @PutMapping("/{id}")
    public ProjectResponse updateProject(@PathVariable Long id, @RequestBody @Valid ProjectRequest request) {
        return projectService.updateProject(id, request);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
    }
}
