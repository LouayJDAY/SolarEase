package com.solarease.service;

import com.solarease.entity.Client;
import com.solarease.entity.DocumentEntity;
import com.solarease.entity.InvoiceEntity;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.DocumentRepository;
import com.solarease.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DocumentDownloadService {

    private final DocumentRepository documentRepository;
    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoicePdfService invoicePdfService;
    private final DocumentPdfService documentPdfService;

    @Transactional(readOnly = true)
    public ResponseEntity<?> downloadDocument(Long id, String userId, String userRole, boolean attachment) {
        DocumentEntity doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        if (!canAccessDocument(doc, userId, userRole)) {
            throw new ResourceNotFoundException("Document not found: " + id);
        }

        String url = doc.getUrl();
        if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(url))
                    .build();
        }

        byte[] pdfBytes;
        String filename = sanitizeFilename(doc.getName()) + ".pdf";

        if (doc.getType() == DocumentEntity.DocumentType.FACTURE) {
            InvoiceEntity invoice = resolveInvoiceForDocument(doc);
            pdfBytes = invoicePdfService.generateInvoicePdf(invoice);
            filename = sanitizeFilename(invoice.getNumber()) + ".pdf";
        } else {
            pdfBytes = documentPdfService.generateDocumentPdf(doc);
        }

        String disposition = attachment ? "attachment" : "inline";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    private InvoiceEntity resolveInvoiceForDocument(DocumentEntity doc) {
        if (doc.getProject() == null) {
            throw new ResourceNotFoundException("No project linked to document");
        }

        List<InvoiceEntity> invoices = invoiceRepository.findByProject_Id(doc.getProject().getId());
        if (invoices.isEmpty()) {
            throw new ResourceNotFoundException("No invoice found for document");
        }

        String docName = doc.getName() != null ? doc.getName().toLowerCase() : "";
        Optional<InvoiceEntity> byNumber = invoices.stream()
                .filter(inv -> inv.getNumber() != null && docName.contains(inv.getNumber().toLowerCase()))
                .findFirst();
        if (byNumber.isPresent()) {
            return byNumber.get();
        }

        return invoices.stream()
                .max(Comparator.comparing(InvoiceEntity::getDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElseThrow(() -> new ResourceNotFoundException("No invoice found for document"));
    }

    private boolean canAccessDocument(DocumentEntity doc, String userId, String userRole) {
        if ("ADMIN".equalsIgnoreCase(userRole)) {
            return true;
        }

        if ("INSTALLER".equalsIgnoreCase(userRole)) {
            return userId != null && userId.equals(doc.getInstallerId());
        }

        if ("CLIENT".equalsIgnoreCase(userRole)) {
            if (userId == null) {
                return false;
            }
            if (userId.equals(doc.getClientId())) {
                return true;
            }
            Optional<Client> client = clientRepository.findByUserId(userId);
            return client.map(c -> String.valueOf(c.getId()).equals(doc.getClientId())).orElse(false);
        }

        return false;
    }

    private String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) {
            return "document";
        }
        return name.replaceAll("[^a-zA-Z0-9._\\- àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]", "_");
    }
}
