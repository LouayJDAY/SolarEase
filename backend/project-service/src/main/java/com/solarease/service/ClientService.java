package com.solarease.service;

import com.solarease.dto.ClientRequest;
import com.solarease.dto.ClientResponse;
import com.solarease.entity.Client;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
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
        return mapToResponse(client);
    }

    public Page<ClientResponse> getClientsByInstaller(String installerId, String search, Pageable pageable) {
        log.debug("Fetching clients for installer {} with search={}", installerId, search);
        return clientRepository.findByInstallerIdWithSearch(installerId, search, pageable)
                .map(this::mapToResponse);
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

    public void deleteClient(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client not found with id: " + id);
        }
        clientRepository.deleteById(id);
        log.info("Deleted client {}", id);
    }

    private ClientResponse mapToResponse(Client client) {
        return ClientResponse.builder()
                .id(client.getId())
                .firstName(client.getFirstName())
                .lastName(client.getLastName())
                .email(client.getEmail())
                .phoneNumber(client.getPhoneNumber())
                .address(client.getAddress())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .build();
    }
}
