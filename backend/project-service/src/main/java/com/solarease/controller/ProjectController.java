package com.solarease.controller;

import com.solarease.dto.DashboardStatsResponse;
import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.enums.ProjectStatus;
import com.solarease.service.AccessControlService;
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
    private final AccessControlService accessControlService;

    // ── Create ───────────────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse createProject(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader(value = "X-User-Email", required = false) String installerEmail,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid ProjectRequest request) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return projectService.createProject(installerId, installerEmail, null, null, request);
    }

    @PostMapping("/admin/assign")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse createProjectAsAdmin(
            @RequestHeader("X-User-Id") String adminId,
            @RequestHeader(value = "X-User-Email", required = false) String adminEmail,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid ProjectRequest request) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        if (request.getInstallerId() == null || request.getInstallerId().isBlank()) {
            throw new IllegalArgumentException("installerId is required for admin project creation");
        }
        return projectService.createProject(
                request.getInstallerId(),
                request.getInstallerEmail(),
                adminId,
                adminEmail,
                request);
    }

    @GetMapping("/all")
    public Page<ProjectResponse> getAllProjects(
            @RequestHeader("X-User-Role") String userRole,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return projectService.getAllProjects(status, search, pageable);
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    @GetMapping
    public Page<ProjectResponse> getMyProjects(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
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

        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return projectService.getProjectsByInstaller(installerId, status, search, pageable);
    }

    @GetMapping("/{id}")
    public ProjectResponse getProjectById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN", "CLIENT");
        return projectService.getProjectById(id);
    }

    @GetMapping("/my")
    public List<ProjectResponse> getMyProjects(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT");
        return projectService.getProjectsByClientUserId(userId);
    }

    @GetMapping("/client/{clientId}")
    public List<ProjectResponse> getProjectsByClientId(
            @PathVariable Long clientId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN", "CLIENT");
        return projectService.getProjectsByClientId(clientId);
    }

    // ── Dashboard ────────────────────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    public DashboardStatsResponse getDashboardStats(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        // For ADMIN, return all stats; for INSTALLER, return only their stats
        String filterBy = "ADMIN".equalsIgnoreCase(userRole) ? null : userId;
        return projectService.getDashboardStats(filterBy);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    public ProjectResponse updateProjectStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return projectService.updateProjectStatus(id, status);
    }

    @PutMapping("/{id}")
    public ProjectResponse updateProject(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String currentUserId,
            @RequestHeader(value = "X-User-Email", required = false) String currentUserEmail,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid ProjectRequest request) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return projectService.updateProject(id, userRole, currentUserId, currentUserEmail, request);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        projectService.deleteProject(id);
    }
}
