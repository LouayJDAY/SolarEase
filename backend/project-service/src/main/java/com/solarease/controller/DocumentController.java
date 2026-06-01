package com.solarease.controller;

import com.solarease.dto.DocumentDto;
import com.solarease.entity.DocumentEntity;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.DocumentRepository;
import com.solarease.service.AccessControlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentRepository documentRepository;
    private final AccessControlService accessControlService;

    @GetMapping("/{id}")
    public DocumentDto getDocumentById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        DocumentEntity doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
        return toDto(doc);
    }

    @GetMapping("/project/{projectId}")
    public List<DocumentDto> getDocumentsByProject(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        return documentRepository.findByProject_Id(projectId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    @GetMapping("/installer/list")
    public Page<DocumentDto> getDocumentsByInstaller(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
            Pageable pageable) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return documentRepository.findByInstallerId(installerId, pageable).map(this::toDto);
    }

    @GetMapping("/client/list")
    public List<DocumentDto> getDocumentsByClient(
            @RequestHeader("X-User-Id") String clientId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        return documentRepository.findByClientId(clientId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentDto createDocument(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody DocumentCreateRequest request) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");

        DocumentEntity doc = DocumentEntity.builder()
                .name(request.getName())
                .type(DocumentEntity.DocumentType.valueOf(request.getType().toUpperCase()))
                .description(request.getDescription())
                .url(request.getUrl())
                .size(request.getSize())
                .date(LocalDate.now())
                .clientId(request.getClientId())
                .installerId(installerId)
                .createdBy(installerId)
                .notes(request.getNotes())
                .build();

        return toDto(documentRepository.save(doc));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDocument(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        if (!documentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Document not found: " + id);
        }
        documentRepository.deleteById(id);
    }

    private DocumentDto toDto(DocumentEntity d) {
        return new DocumentDto(
                String.valueOf(d.getId()),
                d.getName(),
                d.getType().name(),
                "DISPONIBLE",
                d.getSize(),
                d.getDate(),
                d.getUrl()
        );
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DocumentCreateRequest {
        private String name;
        private String type;
        private String description;
        private String url;
        private String size;
        private String clientId;
        private String notes;
    }
}
