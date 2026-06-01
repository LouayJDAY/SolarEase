package com.solarease.service;

import com.solarease.entity.Project;
import com.solarease.exception.AuthorizationException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccessControlService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;

    public void requireAnyRole(String roleHeader, String... allowedRoles) {
        if (roleHeader == null || roleHeader.isBlank()) {
            throw new AuthorizationException("Missing X-User-Role header");
        }
        String normalizedRole = roleHeader.toUpperCase(Locale.ROOT);
        Set<String> allowed = Arrays.stream(allowedRoles)
                .map(r -> r.toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (!allowed.contains(normalizedRole)) {
            throw new AuthorizationException("Access denied for role: " + roleHeader);
        }
    }

    public void requireClientOwnsResource(String roleHeader, String userId, String resourceClientId) {
        String normalizedRole = roleHeader == null ? "" : roleHeader.toUpperCase(Locale.ROOT);
        if (!"CLIENT".equals(normalizedRole)) {
            return;
        }
        if (userId == null || resourceClientId == null || !userId.equals(resourceClientId)) {
            throw new AuthorizationException("Client can access only own resources");
        }
    }

    public void requireProjectAccess(String roleHeader, String userId, String userEmail, Long projectId) {
        String normalizedRole = roleHeader == null ? "" : roleHeader.toUpperCase(Locale.ROOT);
        if ("ADMIN".equals(normalizedRole)) {
            return;
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AuthorizationException("Project not found or inaccessible"));

        if ("INSTALLER".equals(normalizedRole)) {
            if (project.getInstallerId() == null || !project.getInstallerId().equals(userId)) {
                throw new AuthorizationException("Installer can access only own projects");
            }
            return;
        }

        if ("CLIENT".equals(normalizedRole)) {
            if (userEmail == null || userEmail.isBlank()) {
                throw new AuthorizationException("Missing X-User-Email header");
            }

            Long clientId = clientRepository.findByEmail(userEmail)
                    .map(c -> c.getId())
                    .orElseThrow(() -> new AuthorizationException("Client profile not found for authenticated user"));

            if (project.getClientId() == null || !project.getClientId().equals(clientId)) {
                throw new AuthorizationException("Client can access only own projects");
            }
            return;
        }

        throw new AuthorizationException("Access denied for role: " + roleHeader);
    }

    public Long parseLongId(String id, String fieldName) {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException ex) {
            throw new AuthorizationException("Invalid " + fieldName + " format: expected numeric id");
        }
    }
}
