package com.solarease.controller;

import com.solarease.dto.FieldUpdateCreateRequest;
import com.solarease.dto.FieldUpdateDTO;
import com.solarease.service.AccessControlService;
import com.solarease.service.FieldUpdateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/field-updates")
@RequiredArgsConstructor
@Slf4j
public class FieldUpdateController {

    private final FieldUpdateService fieldUpdateService;
    private final AccessControlService accessControlService;

    // ── Installer: post a new field update ───────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FieldUpdateDTO createFieldUpdate(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Id")    String installerId,
            @RequestHeader(value = "X-User-Email", required = false) String installerEmail,
            @RequestHeader("X-User-Role")  String userRole,
            @Valid @RequestBody FieldUpdateCreateRequest request) {

        accessControlService.requireAnyRole(userRole, "INSTALLER");
        log.info("POST field-update for project {} by installer {}", projectId, installerId);
        return fieldUpdateService.createFieldUpdate(projectId, installerId, installerEmail, request);
    }

    // ── All roles: list history ───────────────────────────────────────────────

    @GetMapping
    public List<FieldUpdateDTO> getFieldUpdates(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Role") String userRole) {

        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN", "CLIENT");
        return fieldUpdateService.getFieldUpdates(projectId);
    }

    // ── All roles: latest update ──────────────────────────────────────────────

    @GetMapping("/latest")
    public FieldUpdateDTO getLatestFieldUpdate(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Role") String userRole) {

        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN", "CLIENT");
        return fieldUpdateService.getLatestFieldUpdate(projectId);
    }

    // ── Admin: validate / reject a field update ───────────────────────────────

    @PatchMapping("/{updateId}/validate")
    public FieldUpdateDTO validateFieldUpdate(
            @PathVariable Long projectId,
            @PathVariable Long updateId,
            @RequestHeader("X-User-Id")    String adminId,
            @RequestHeader(value = "X-User-Email", required = false) String adminEmail,
            @RequestHeader("X-User-Role")  String userRole,
            @RequestBody Map<String, String> body) {

        accessControlService.requireAnyRole(userRole, "ADMIN");
        boolean validated = Boolean.parseBoolean(body.getOrDefault("validated", "true"));
        String adminNote = body.get("adminNote");
        return fieldUpdateService.validateFieldUpdate(updateId, adminId, adminEmail, validated, adminNote);
    }
}
