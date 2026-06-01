package com.solarease.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

@Service
public class N8nWebhookService {

    private final RestTemplate restTemplate = new RestTemplate();
    
    // Remets l'URL copiée depuis n8n (utilise webhook-test pour les tests, et webhook pour la prod)
    private final String WEBHOOK_URL = "http://n8n:5678/webhook-test/nouvel-utilisateur";

    public void sendEventToN8n(String userName, String email, String eventType) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Préparation des données à envoyer
            Map<String, Object> payload = new HashMap<>();
            payload.put("nom", userName);
            payload.put("email", email);
            payload.put("event", eventType);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            // Envoi de la requête POST vers n8n (depuis Spring Boot)
            restTemplate.postForEntity(WEBHOOK_URL, request, String.class);
            
            System.out.println("Événement envoyé à n8n avec succès !");
            
        } catch (Exception e) {
            System.err.println("Erreur lors de l'envoi à n8n : " + e.getMessage());
        }
    }
}
