package com.solarease.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Calls Ollama's {@code /api/embeddings} endpoint to turn a piece of text into
 * a fixed-size vector. The vectors are stored in {@code knowledge_chunks} and
 * used both at indexing time (one call per chunk) and at query time (one call
 * per dimensioning result).
 *
 * <p>If Ollama is unreachable the service throws {@link EmbeddingException};
 * upstream code is expected to fall back to deterministic recommendations
 * without semantic retrieval.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ollama.embedding-model:nomic-embed-text}")
    private String embeddingModel;

    @Value("${ollama.embedding-dimension:768}")
    private int embeddingDimension;

    public float[] embed(String text) {
        String url = ollamaBaseUrl + "/api/embeddings";

        Map<String, Object> body = new HashMap<>();
        body.put("model", embeddingModel);
        body.put("prompt", text);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            String raw = restTemplate.postForObject(url,
                    new HttpEntity<>(body, headers), String.class);
            return parseEmbedding(raw);
        } catch (Exception e) {
            log.error("Embedding call to Ollama failed: {}", e.getMessage());
            throw new EmbeddingException("Ollama embedding call failed", e);
        }
    }

    public int getDimension() {
        return embeddingDimension;
    }

    private float[] parseEmbedding(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new EmbeddingException("Empty embedding response from Ollama");
        }
        try {
            JsonNode root = objectMapper.readTree(raw);
            JsonNode array = root.path("embedding");
            if (!array.isArray() || array.isEmpty()) {
                throw new EmbeddingException(
                        "Ollama response did not contain an embedding array: " + raw);
            }
            float[] out = new float[array.size()];
            for (int i = 0; i < array.size(); i++) {
                out[i] = (float) array.get(i).asDouble();
            }
            if (out.length != embeddingDimension) {
                log.warn("Embedding dimension {} does not match configured {} -- "
                        + "you may need to update ollama.embedding-dimension.",
                        out.length, embeddingDimension);
            }
            return out;
        } catch (EmbeddingException e) {
            throw e;
        } catch (Exception e) {
            throw new EmbeddingException("Could not parse Ollama embedding response", e);
        }
    }

    /** Thrown when the embedding model is unreachable or returns garbage. */
    public static class EmbeddingException extends RuntimeException {
        public EmbeddingException(String message) {
            super(message);
        }

        public EmbeddingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
