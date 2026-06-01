package com.solarease.service;

import com.solarease.dto.ClientRequest;
import com.solarease.dto.ClientResponse;
import com.solarease.dto.ClientStatsResponse;
import com.solarease.entity.Client;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.ProjectRepository;
import org.springframework.data.domain.PageImpl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientService {

    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;

    public ClientResponse createClient(String installerId, ClientRequest request) {
        if (clientRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }
        Client client = Client.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .address(request.getAddress())
                .installerId(installerId)
                .build();

        log.info("Creating client '{}' for installer {}", request.getEmail(), installerId);
        return mapToResponse(clientRepository.save(client));
    }

    public ClientResponse getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));
        long count = projectRepository.countByClientId(id);
        return mapToResponse(client, count);
    }

    public Page<ClientResponse> getClientsByInstaller(String installerId, String search, Pageable pageable) {
        log.debug("Fetching clients for installer {} with search={}", installerId, search);
        var clientsPage = clientRepository.findByInstallerIdWithSearch(installerId, search, pageable);
        List<Long> ids = clientsPage.getContent().stream().map(Client::getId).collect(Collectors.toList());
        List<Object[]> counts = ids.isEmpty() ? List.of() : projectRepository.countByClientIds(ids);
        Map<Long, Long> countMap = new HashMap<>();
        for (Object[] row : counts) {
            Long clientId = ((Number) row[0]).longValue();
            Long cnt = ((Number) row[1]).longValue();
            countMap.put(clientId, cnt);
        }
        List<ClientResponse> responses = clientsPage.getContent().stream()
                .map(c -> mapToResponse(c, countMap.getOrDefault(c.getId(), 0L)))
                .collect(Collectors.toList());
        return new PageImpl<>(responses, pageable, clientsPage.getTotalElements());
    }

    public Page<ClientResponse> getAllClients(String search, Pageable pageable) {
        log.debug("Fetching all clients with search={}", search);
        var clientsPage = clientRepository.findAllWithSearch(search, pageable);
        List<Long> ids = clientsPage.getContent().stream().map(Client::getId).collect(Collectors.toList());
        List<Object[]> counts = ids.isEmpty() ? List.of() : projectRepository.countByClientIds(ids);
        Map<Long, Long> countMap = new HashMap<>();
        for (Object[] row : counts) {
            Long clientId = ((Number) row[0]).longValue();
            Long cnt = ((Number) row[1]).longValue();
            countMap.put(clientId, cnt);
        }
        List<ClientResponse> responses = clientsPage.getContent().stream()
                .map(c -> mapToResponse(c, countMap.getOrDefault(c.getId(), 0L)))
                .collect(Collectors.toList());
        return new PageImpl<>(responses, pageable, clientsPage.getTotalElements());
    }

    @Transactional
    public ClientResponse updateClient(Long id, ClientRequest request) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));

        client.setFirstName(request.getFirstName());
        client.setLastName(request.getLastName());
        client.setPhoneNumber(request.getPhoneNumber());
        client.setAddress(request.getAddress());
        
        // Only update email if it's different and not taken
        if (!client.getEmail().equals(request.getEmail())) {
            if (clientRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email already in use");
            }
            client.setEmail(request.getEmail());
        }

        log.info("Updated client {}", id);
        return mapToResponse(clientRepository.save(client));
    }

    public ClientStatsResponse getClientStats(String installerId, String userRole) {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userRole);

        long totalClients = isAdmin
                ? clientRepository.count()
                : clientRepository.countByInstallerId(installerId);

        long addedThisMonth = isAdmin
                ? clientRepository.countByCreatedAtAfter(startOfMonth)
                : clientRepository.countByInstallerIdAndCreatedAtAfter(installerId, startOfMonth);

        long totalProjectsLinked = isAdmin
                ? projectRepository.countDistinctClients()
                : projectRepository.countDistinctClientsByInstallerId(installerId);

        return ClientStatsResponse.builder()
                .totalClients(totalClients)
                .totalProjectsLinked(totalProjectsLinked)
                .addedThisMonth(addedThisMonth)
                .build();
    }

    public void deleteClient(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client not found with id: " + id);
        }
        clientRepository.deleteById(id);
        log.info("Deleted client {}", id);
    }

    private ClientResponse mapToResponse(Client client) {
        return mapToResponse(client, 0L);
    }

    private ClientResponse mapToResponse(Client client, long projectCount) {
        return ClientResponse.builder()
                .id(client.getId())
                .firstName(client.getFirstName())
                .installerId(client.getInstallerId())
                .userId(client.getUserId())
                .lastName(client.getLastName())
                .email(client.getEmail())
                .phoneNumber(client.getPhoneNumber())
                .address(client.getAddress())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .projectCount(projectCount)
                .build();
    }
}
