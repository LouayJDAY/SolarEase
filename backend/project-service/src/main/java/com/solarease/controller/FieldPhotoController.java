package com.solarease.controller;

import com.solarease.dto.FieldPhotoUploadResponse;
import com.solarease.service.AccessControlService;
import com.solarease.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class FieldPhotoController {

    private final FileStorageService fileStorageService;
    private final AccessControlService accessControlService;

    @PostMapping(value = "/{projectId}/field-updates/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public FieldPhotoUploadResponse uploadFieldPhoto(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestHeader("X-User-Role") String userRole,
            @RequestPart("file") MultipartFile file) {
        accessControlService.requireAnyRole(userRole, "INSTALLER");
        accessControlService.requireProjectAccess(userRole, userId, userEmail, projectId);

        FileStorageService.StoredFile stored = fileStorageService.saveFieldPhoto(projectId, file);
        return new FieldPhotoUploadResponse(stored.publicUrl(), stored.fileName());
    }
}
