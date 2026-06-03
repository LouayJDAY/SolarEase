package com.solarease.service;

import com.solarease.dto.LinkAccountRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class ProjectServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${solarease.project-service.url:http://project-service:8082}")
    private String projectServiceUrl;

    @Value("${solarease.internal.secret:change_me_n8n_secret}")
    private String internalSecret;

    public void linkClientAccount(String userId, String email, String invitationToken) {
        LinkAccountRequest body = new LinkAccountRequest();
        body.setUserId(userId);
        body.setEmail(email);
        body.setInvitationToken(invitationToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Secret", internalSecret);

        String url = projectServiceUrl + "/api/internal/clients/link-account";
        try {
            restTemplate.postForEntity(url, new HttpEntity<>(body, headers), String.class);
            log.info("Linked client account for {} to user {}", email, userId);
        } catch (RestClientException ex) {
            log.warn("Failed to link client account for {}: {}", email, ex.getMessage());
        }
    }
}
