package com.solarease.controller;

import com.solarease.dto.ClientRequest;
import com.solarease.dto.ClientResponse;
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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientResponse createClient(
            @RequestHeader("X-User-Id") String installerId,
            @RequestBody @Valid ClientRequest request) {
        return clientService.createClient(installerId, request);
    }

    @GetMapping("/{id}")
    public ClientResponse getClientById(@PathVariable Long id) {
        return clientService.getClientById(id);
    }

    @GetMapping
    public Page<ClientResponse> getMyClients(
            @RequestHeader("X-User-Id") String installerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return clientService.getClientsByInstaller(installerId, search, pageable);
    }

    @PutMapping("/{id}")
    public ClientResponse updateClient(@PathVariable Long id, @RequestBody @Valid ClientRequest request) {
        return clientService.updateClient(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
    }
}
