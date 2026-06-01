package com.solarease.service;

import com.solarease.dto.OllamaRequest;
import com.solarease.dto.OllamaResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
@RequiredArgsConstructor
public class OllamaService {

    private final RestTemplate restTemplate;

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.model:mistral}")
    private String ollamaModel;

    public String generate(String prompt) {
        String ollamaApiUrl = ollamaBaseUrl + "/api/generate";
        try {
            OllamaRequest request = OllamaRequest.builder()
                    .model(ollamaModel)
                    .prompt(prompt)
                    .stream(false)
                    .build();

            ResponseEntity<OllamaResponse> response = restTemplate.postForEntity(
                    ollamaApiUrl,
                    request,
                    OllamaResponse.class
            );

            if (response.getBody() != null) {
                return response.getBody().getResponse();
            } else {
                log.warn("Ollama returned empty response");
                return "Désolé, je n'ai pas pu obtenir une réponse de l'assistant IA.";
            }

        } catch (Exception e) {
            log.error("Error calling Ollama: {}", e.getMessage());
            return "Une erreur est survenue lors de la communication avec l'assistant IA.";
        }
    }
}
