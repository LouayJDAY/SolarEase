package com.solarease.invoice;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Fast invoice extraction via Google Gemini Vision (~5–25 s).
 * Disabled when {@code gemini.api-key} is empty — Tesseract fallback is used instead.
 */
@Service
@Slf4j
public class GeminiInvoiceExtractor {

    private static final String PROMPT = """
            Tu analyses une facture d'électricité tunisienne (souvent STEG).
            Retourne UNIQUEMENT un JSON valide, sans markdown:
            {
              "supplierName": "STEG ou autre",
              "invoiceNumber": "référence client si visible",
              "date": "date ou fin de période",
              "totalElectricityTND": nombre décimal,
              "currency": "TND"
            }
            Règles STEG:
            - totalElectricityTND = ligne "Total" ou montant de la section ÉLECTRICITÉ uniquement.
            - NE PAS utiliser le gaz, MONTANT TOTAL global, ni "Montant à payer".
            - Les montants STEG sont en millimes: 118,912 millimes = 118.912 TND.
            - Si un champ est illisible, mets null.
            """;

    private static final Pattern JSON_BLOCK = Pattern.compile("\\{[\\s\\S]*}");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    public GeminiInvoiceExtractor(RestTemplateBuilder restTemplateBuilder,
                                  @Value("${gemini.timeout-seconds:45}") int timeoutSeconds) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(timeoutSeconds))
                .build();
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public InvoiceDTO extract(File imageFile) throws Exception {
        if (!isEnabled()) {
            return null;
        }

        String mimeType = mimeType(imageFile.getName());
        String base64 = Base64.getEncoder().encodeToString(Files.readAllBytes(imageFile.toPath()));

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + apiKey;

        Map<String, Object> inlineData = Map.of(
                "mime_type", mimeType,
                "data", base64
        );
        Map<String, Object> textPart = Map.of("text", PROMPT);
        Map<String, Object> imagePart = Map.of("inline_data", inlineData);

        Map<String, Object> generationConfig = Map.of(
                "temperature", 0.1,
                "responseMimeType", "application/json"
        );

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(textPart, imagePart))),
                "generationConfig", generationConfig
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        long start = System.currentTimeMillis();
        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
        log.info("Gemini vision responded in {} ms", System.currentTimeMillis() - start);

        return mapResponse(response.getBody());
    }

    InvoiceDTO mapResponse(String rawResponse) throws Exception {
        if (rawResponse == null || rawResponse.isBlank()) {
            return null;
        }
        JsonNode root = objectMapper.readTree(rawResponse);
        String text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);
        if (text == null || text.isBlank()) {
            return null;
        }

        String json = text.trim();
        if (!json.startsWith("{")) {
            Matcher matcher = JSON_BLOCK.matcher(json);
            if (!matcher.find()) {
                return null;
            }
            json = matcher.group();
        }

        JsonNode data = objectMapper.readTree(json);
        InvoiceDTO dto = new InvoiceDTO();
        dto.supplierName = textOrNull(data, "supplierName");
        dto.invoiceNumber = textOrNull(data, "invoiceNumber");
        dto.date = textOrNull(data, "date");
        dto.currency = textOrNull(data, "currency");
        if (dto.currency == null || dto.currency.isBlank()) {
            dto.currency = "TND";
        }

        JsonNode amountNode = data.get("totalElectricityTND");
        if (amountNode != null && !amountNode.isNull()) {
            dto.totalTTC = amountNode.isNumber()
                    ? amountNode.decimalValue()
                    : parseDecimal(amountNode.asText());
        }

        dto.confidences = new HashMap<>();
        dto.confidences.put("supplierName", dto.supplierName != null ? 0.92 : 0.0);
        dto.confidences.put("invoiceNumber", dto.invoiceNumber != null ? 0.9 : 0.0);
        dto.confidences.put("date", dto.date != null ? 0.85 : 0.0);
        dto.confidences.put("totalTTC", dto.totalTTC != null ? 0.9 : 0.0);
        dto.confidences.put("currency", 0.85);
        dto.confidences.put("supplierAddress", 0.0);
        dto.lines = new ArrayList<>();

        return dto.totalTTC != null ? dto : null;
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText().trim();
        return text.isEmpty() || "null".equalsIgnoreCase(text) ? null : text;
    }

    private static BigDecimal parseDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            String cleaned = raw.replaceAll("[^0-9,.-]", "").replace(" ", "");
            if (cleaned.contains(",") && cleaned.contains(".")) {
                if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                    cleaned = cleaned.replace(".", "").replace(',', '.');
                } else {
                    cleaned = cleaned.replace(",", "");
                }
            } else {
                cleaned = cleaned.replace(',', '.');
            }
            return new BigDecimal(cleaned);
        } catch (Exception e) {
            return null;
        }
    }

    private static String mimeType(String fileName) {
        String lower = fileName == null ? "" : fileName.toLowerCase();
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        if (lower.endsWith(".pdf")) {
            return "application/pdf";
        }
        return "image/jpeg";
    }
}
