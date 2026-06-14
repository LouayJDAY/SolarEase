package com.solarease.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Service
@Slf4j
public class IdentityServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${solarease.identity-service.url:http://identity-service:8081}")
    private String identityServiceUrl;

    @Value("${solarease.n8n.internal-secret:change_me_n8n_secret}")
    private String internalSecret;

    public boolean emailHasPortalAccount(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String url = UriComponentsBuilder
                .fromHttpUrl(identityServiceUrl + "/api/auth/email-exists")
                .queryParam("email", email.trim())
                .toUriString();
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restTemplate.getForObject(url, Map.class);
            return body != null && Boolean.TRUE.equals(body.get("exists"));
        } catch (RestClientException ex) {
            log.warn("Could not check identity email-exists for {}: {}", email, ex.getMessage());
            return false;
        }
    }

    public void deleteClientPortalAccount(String userId, String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        String normalized = email.trim().toLowerCase(java.util.Locale.ROOT);
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(identityServiceUrl + "/api/internal/users/client");
        if (userId != null && !userId.isBlank()) {
            builder.queryParam("uuid", userId.trim());
        }
        builder.queryParam("email", normalized);
        String url = builder.toUriString();
        try {
            delete(url);
            if (emailHasPortalAccount(normalized)) {
                log.error("Portal account still exists after delete for {}", normalized);
                // #region agent log
                com.solarease.debug.DebugTrace.log("H1", "IdentityServiceClient.deleteClientPortalAccount",
                        "delete completed but user still exists",
                        java.util.Map.of("emailDomain", normalized.substring(normalized.indexOf('@'))));
                // #endregion
            }
        } catch (RestClientException ex) {
            log.warn("Could not delete portal account (uuid={}, email={}): {}", userId, normalized, ex.getMessage());
            // #region agent log
            com.solarease.debug.DebugTrace.log("H1", "IdentityServiceClient.deleteClientPortalAccount",
                    "delete failed",
                    java.util.Map.of("error", ex.getMessage() != null ? ex.getMessage() : "unknown"));
            // #endregion
        }
    }

    private void delete(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Secret", internalSecret);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
    }
}
