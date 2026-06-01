package com.solarease.controller;

import com.solarease.dto.ProductCatalogDTO;
import com.solarease.service.AccessControlService;
import com.solarease.service.ProductCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class ProductCatalogController {

    private final ProductCatalogService service;
    private final AccessControlService accessControlService;

    /**
     * GET /api/catalog?q=panneau&category=MATERIEL
     * All roles can search the catalog.
     */
    @GetMapping
    public ResponseEntity<List<ProductCatalogDTO>> search(
            @RequestHeader("X-User-Role") String userRole,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category) {
        accessControlService.requireAnyRole(userRole, "ADMIN", "INSTALLER", "CLIENT");
        return ResponseEntity.ok(service.search(q, category));
    }

    /**
     * POST /api/catalog — Admin only: add a new product to the catalog.
     */
    @PostMapping
    public ResponseEntity<ProductCatalogDTO> create(
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody ProductCatalogDTO dto) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    /**
     * DELETE /api/catalog/{id} — Admin only.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-User-Role") String userRole,
            @PathVariable Long id) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
