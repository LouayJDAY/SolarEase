package com.solarease.service;

import com.solarease.entity.Client;
import com.solarease.entity.InvoiceEntity;
import com.solarease.entity.Project;
import com.solarease.repository.ClientRepository;
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
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class N8nInvoiceWebhookService {

    private final ClientRepository clientRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${solarease.n8n.enabled:false}")
    private boolean enabled;

    @Value("${solarease.n8n.invoice-webhook-url:http://n8n:5678/webhook/solarease-invoice}")
    private String invoiceWebhookUrl;

    public void notifyInvoiceReady(InvoiceEntity invoice, String trigger) {
        if (!enabled) {
            log.debug("n8n disabled — skip invoice webhook (trigger={})", trigger);
            return;
        }

        Project project = invoice.getProject();
        if (project == null) {
            log.warn("n8n invoice webhook skipped: invoice {} has no project", invoice.getId());
            return;
        }

        Optional<String> clientEmail = resolveClientEmail(invoice, project);
        if (clientEmail.isEmpty()) {
            log.warn("n8n invoice webhook skipped: no client email for invoice {}", invoice.getId());
            return;
        }

        log.info("n8n invoice webhook → clientEmail={} invoice={} project={}",
                clientEmail.get(), invoice.getNumber(), project.getName());

        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "invoice.ready");
        payload.put("trigger", trigger);
        payload.put("invoiceId", invoice.getId());
        payload.put("invoiceNumber", invoice.getNumber());
        payload.put("projectId", project.getId());
        payload.put("projectName", project.getName());
        payload.put("clientEmail", clientEmail.get());
        payload.put("amount", invoice.getAmount());
        payload.put("dueDate", invoice.getDueDate() != null ? invoice.getDueDate().toString() : null);
        payload.put("pdfUrl", "http://project-service:8082/api/internal/invoices/" + invoice.getId() + "/pdf");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(invoiceWebhookUrl, new HttpEntity<>(payload, headers), String.class);
            log.info("n8n invoice webhook sent for invoice {} ({})", invoice.getNumber(), trigger);
        } catch (Exception e) {
            log.error("Failed to call n8n invoice webhook for invoice {}: {}", invoice.getId(), e.getMessage());
        }
    }

    private Optional<String> resolveClientEmail(InvoiceEntity invoice, Project project) {
        if (project.getClientId() != null) {
            Optional<Client> client = clientRepository.findById(project.getClientId());
            if (client.isPresent() && client.get().getEmail() != null && !client.get().getEmail().isBlank()) {
                return Optional.of(client.get().getEmail());
            }
        }

        if (invoice.getClientId() != null && !invoice.getClientId().isBlank()) {
            Optional<Client> byUser = clientRepository.findByUserId(invoice.getClientId());
            if (byUser.isPresent() && byUser.get().getEmail() != null) {
                return Optional.of(byUser.get().getEmail());
            }
            try {
                Long pk = Long.parseLong(invoice.getClientId());
                Optional<Client> byId = clientRepository.findById(pk);
                if (byId.isPresent() && byId.get().getEmail() != null) {
                    return Optional.of(byId.get().getEmail());
                }
            } catch (NumberFormatException ignored) {
                // not a numeric client id
            }
        }

        return Optional.empty();
    }
}
