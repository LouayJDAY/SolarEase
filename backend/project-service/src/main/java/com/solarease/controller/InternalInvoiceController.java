package com.solarease.controller;

import com.solarease.entity.InvoiceEntity;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.InvoiceRepository;
import com.solarease.service.InvoicePdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;

/**
 * Endpoints internes appelés par n8n (réseau Docker), sans JWT utilisateur.
 */
@RestController
@RequestMapping("/api/internal/invoices")
@RequiredArgsConstructor
public class InternalInvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final InvoicePdfService invoicePdfService;

    @Value("${solarease.n8n.internal-secret:change_me_n8n_secret}")
    private String internalSecret;

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getInvoicePdfInternal(
            @PathVariable Long id,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret) {
        if (secret == null || !secret.equals(internalSecret)) {
            throw new ResponseStatusException(FORBIDDEN, "Invalid internal secret");
        }

        InvoiceEntity inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));

        byte[] pdf = invoicePdfService.generateInvoicePdf(inv);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + inv.getNumber() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
