package com.solarease.controller;

import com.solarease.service.AccessControlService;
import com.solarease.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/files/field-photos")
@RequiredArgsConstructor
public class FieldFileController {

    private final FileStorageService fileStorageService;
    private final AccessControlService accessControlService;

    @GetMapping("/{projectId}/{fileName}")
    public ResponseEntity<InputStreamResource> getFieldPhoto(
            @PathVariable Long projectId,
            @PathVariable String fileName,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestHeader("X-User-Role") String userRole) throws IOException {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        accessControlService.requireProjectAccess(userRole, userId, userEmail, projectId);

        Path path = fileStorageService.resolveFieldPhotoPath(projectId, fileName);
        String contentType = Files.probeContentType(path);
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        InputStreamResource resource = new InputStreamResource(Files.newInputStream(path));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
}
