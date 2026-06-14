package com.solarease.service;

import com.solarease.dto.ClientMeUpdateRequest;
import com.solarease.dto.ClientRequest;
import com.solarease.dto.ClientResponse;
import com.solarease.dto.ClientStatsResponse;
import com.solarease.debug.DebugTrace;
import com.solarease.entity.Client;
import com.solarease.enums.DemandStatus;
import com.solarease.entity.ConversationEntity;
import com.solarease.entity.Project;
import com.solarease.exception.AuthorizationException;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientInvitationRepository;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.ConversationRepository;
import com.solarease.repository.DemandRepository;
import com.solarease.repository.DocumentRepository;
import com.solarease.repository.FieldUpdateRepository;
import com.solarease.repository.InvoiceRepository;
import com.solarease.repository.NotificationRepository;
import com.solarease.repository.ProjectRepository;
import com.solarease.repository.QuoteRepository;
import com.solarease.repository.SupportTicketRepository;
import org.springframework.data.domain.PageImpl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final QuoteRepository quoteRepository;
    private final InvoiceRepository invoiceRepository;
    private final DocumentRepository documentRepository;
    private final FieldUpdateRepository fieldUpdateRepository;
    private final ConversationRepository conversationRepository;
    private final NotificationRepository notificationRepository;
    private final ClientInvitationRepository clientInvitationRepository;
    private final DemandRepository demandRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final IdentityServiceClient identityServiceClient;

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
                .city(request.getCity())
                .postalCode(request.getPostalCode())
                .clientType(request.getClientType())
                .notes(request.getNotes())
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

    public ClientResponse getClientByUserId(String userId) {
        Client client = clientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found for user: " + userId));
        long count = projectRepository.countByClientId(client.getId());
        return mapToResponse(client, count);
    }

    @Transactional
    public ClientResponse updateClientByUserId(String userId, ClientMeUpdateRequest request) {
        Client client = clientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Client profile not found for user: " + userId));

        if (request.getFirstName() != null) {
            client.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            client.setLastName(request.getLastName());
        }
        if (request.getPhoneNumber() != null) {
            client.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAddress() != null) {
            client.setAddress(request.getAddress());
        }

        log.info("Updated client profile for user {}", userId);
        return mapToResponse(clientRepository.save(client), projectRepository.countByClientId(client.getId()));
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
        client.setCity(request.getCity());
        client.setPostalCode(request.getPostalCode());
        client.setClientType(request.getClientType());
        client.setNotes(request.getNotes());
        
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

    @Transactional
    public void deleteClient(Long id, String requesterId, String userRole) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + id));

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            if (client.getInstallerId() == null || !client.getInstallerId().equals(requesterId)) {
                throw new AuthorizationException("Installer can delete only own clients");
            }
        }

        Set<String> clientKeys = resolveClientKeys(id, client.getUserId());
        List<Project> projects = projectRepository.findByClientId(id);

        for (Project project : projects) {
            Long projectId = project.getId();
            quoteRepository.deleteAll(quoteRepository.findByProject_Id(projectId));
            invoiceRepository.deleteAll(invoiceRepository.findByProject_Id(projectId));
            documentRepository.deleteAll(documentRepository.findByProject_Id(projectId));
            fieldUpdateRepository.deleteAll(fieldUpdateRepository.findByProjectIdOrderByCreatedAtDesc(projectId));
            for (String key : clientKeys) {
                List<ConversationEntity> conversations =
                        conversationRepository.findByClientIdAndProjectId(key, projectId);
                conversationRepository.deleteAll(conversations);
            }
        }

        quoteRepository.deleteAll(quoteRepository.findAllByClientId(id));
        for (String key : clientKeys) {
            invoiceRepository.deleteAll(invoiceRepository.findByClientId(key));
            documentRepository.deleteAll(documentRepository.findByClientId(key));
            conversationRepository.deleteAll(conversationRepository.findByClientId(key));
            notificationRepository.deleteByClientId(key);
        }

        clientInvitationRepository.deleteByClientId(id);

        String userId = client.getUserId();
        String normalizedEmail = client.getEmail() != null
                ? client.getEmail().trim().toLowerCase(java.util.Locale.ROOT)
                : null;

        if (userId != null && !userId.isBlank()) {
            supportTicketRepository.deleteByClientUserId(userId);
        }
        if (normalizedEmail != null && !normalizedEmail.isBlank()) {
            resetDemandsForRetest(normalizedEmail, userId);
        }

        projectRepository.deleteAll(projects);
        clientRepository.delete(client);

        // #region agent log
        DebugTrace.log("H1", "ClientService.deleteClient", "before portal delete",
                Map.of(
                        "clientId", id,
                        "hadUserId", userId != null && !userId.isBlank(),
                        "emailDomain", normalizedEmail != null && normalizedEmail.contains("@")
                                ? normalizedEmail.substring(normalizedEmail.indexOf('@')) : "unknown"
                ));
        // #endregion
        identityServiceClient.deleteClientPortalAccount(userId, normalizedEmail != null ? normalizedEmail : client.getEmail());
        boolean stillExists = identityServiceClient.emailHasPortalAccount(
                normalizedEmail != null ? normalizedEmail : client.getEmail());
        // #region agent log
        DebugTrace.log("H1", "ClientService.deleteClient", "after portal delete",
                Map.of("clientId", id, "identityStillExists", stillExists));
        // #endregion
        if (stillExists) {
            log.error("Portal account still exists after client {} deletion — check N8N_INTERNAL_SECRET alignment", id);
        }

        log.info("Deleted client {} with {} project(s) and portal account cleanup", id, projects.size());
    }

    /** Keep demand rows so admin can re-promote the same public demand after a reset. */
    private void resetDemandsForRetest(String normalizedEmail, String previousUserId) {
        List<com.solarease.entity.DemandEntity> demands =
                demandRepository.findByClientEmailIgnoreCase(normalizedEmail);
        for (com.solarease.entity.DemandEntity demand : demands) {
            demand.setProjectId(null);
            demand.setStatus(DemandStatus.NOUVELLE);
            if (previousUserId != null && !previousUserId.isBlank()
                    && previousUserId.equals(demand.getClientUserId())) {
                demand.setClientUserId("PUBLIC:" + normalizedEmail);
            }
        }
        if (!demands.isEmpty()) {
            demandRepository.saveAll(demands);
            log.info("Reset {} demand(s) for email {} — ready for re-conversion", demands.size(), normalizedEmail);
        }
    }

    private Set<String> resolveClientKeys(Long clientId, String userId) {
        Set<String> keys = new LinkedHashSet<>();
        if (userId != null && !userId.isBlank()) {
            keys.add(userId);
        }
        keys.add(String.valueOf(clientId));
        return keys;
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
                .city(client.getCity())
                .postalCode(client.getPostalCode())
                .clientType(client.getClientType())
                .notes(client.getNotes())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .projectCount(projectCount)
                .build();
    }
}
