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
        if ((userId == null || userId.isBlank()) && (email == null || email.isBlank())) {
            return;
        }
        String normalized = email != null && !email.isBlank()
                ? email.trim().toLowerCase(java.util.Locale.ROOT)
                : null;
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromHttpUrl(identityServiceUrl + "/api/internal/users/client");
        if (userId != null && !userId.isBlank()) {
            builder.queryParam("uuid", userId.trim());
        }
        if (normalized != null) {
            builder.queryParam("email", normalized);
        }
        String url = builder.toUriString();
        try {
            delete(url);
            if (normalized != null && emailHasPortalAccount(normalized)) {
                log.error("Portal account still exists after delete for {}", normalized);
            }
        } catch (RestClientException ex) {
            log.warn("Could not delete portal account (uuid={}, email={}): {}", userId, normalized, ex.getMessage());
        }
    }

    private void delete(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Secret", internalSecret);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
    }
}
