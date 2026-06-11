package com.solarease.controller;

import com.solarease.dto.ClientMeUpdateRequest;
import com.solarease.dto.ClientRequest;
import com.solarease.dto.ClientResponse;
import com.solarease.dto.ClientStatsResponse;
import com.solarease.service.AccessControlService;
import com.solarease.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;
    private final AccessControlService accessControlService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientResponse createClient(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid ClientRequest request) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return clientService.createClient(installerId, request);
    }

    @GetMapping("/stats")
    public ClientStatsResponse getClientStats(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return clientService.getClientStats(userId, userRole);
    }

    @GetMapping("/me")
    public ClientResponse getMyClientProfile(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT");
        return clientService.getClientByUserId(userId);
    }

    @PutMapping("/me")
    public ClientResponse updateMyClientProfile(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid ClientMeUpdateRequest request) {
        accessControlService.requireAnyRole(userRole, "CLIENT");
        return clientService.updateClientByUserId(userId, request);
    }

    @GetMapping("/{id}")
    public ClientResponse getClientById(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN", "CLIENT");
        return clientService.getClientById(id);
    }

    @GetMapping
    public Page<ClientResponse> getMyClients(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
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
        
        // Admin gets all clients, installer gets only their clients
        if ("ADMIN".equalsIgnoreCase(userRole)) {
            return clientService.getAllClients(search, pageable);
        }
        return clientService.getClientsByInstaller(installerId, search, pageable);
    }

    @PutMapping("/{id}")
    public ClientResponse updateClient(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid ClientRequest request) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return clientService.updateClient(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        clientService.deleteClient(id);
    }
}
