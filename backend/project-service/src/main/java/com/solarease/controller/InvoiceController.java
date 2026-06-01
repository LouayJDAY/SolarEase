package com.solarease.controller;

import com.solarease.dto.InvoiceDto;
import com.solarease.entity.Client;
import com.solarease.entity.InvoiceEntity;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.InvoiceRepository;
import com.solarease.service.AccessControlService;
import com.solarease.service.InvoicePdfService;
import com.solarease.service.NotificationWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final AccessControlService accessControlService;
    private final NotificationWebSocketService notificationWebSocketService;
    private final InvoicePdfService invoicePdfService;

    @GetMapping("/{id}")
    public InvoiceDto getInvoiceById(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        InvoiceEntity inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
        assertInvoiceAccess(inv, userId, userRole);
        return toDto(inv);
    }

        @GetMapping("/{id}/pdf")
        public ResponseEntity<byte[]> getInvoicePdf(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        InvoiceEntity inv = invoiceRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
        assertInvoiceAccess(inv, userId, userRole);

        byte[] pdf = invoicePdfService.generateInvoicePdf(inv);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + inv.getNumber() + ".pdf\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
        }

    @GetMapping("/project/{projectId}")
    public List<InvoiceDto> getInvoicesByProject(
            @PathVariable Long projectId,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        return invoiceRepository.findByProject_Id(projectId).stream()
            .filter(i -> canAccessInvoice(i, userId, userRole))
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    @GetMapping("/installer/list")
    public Page<InvoiceDto> getInvoicesByInstaller(
            @RequestHeader("X-User-Id") String installerId,
            @RequestHeader("X-User-Role") String userRole,
            Pageable pageable) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        return invoiceRepository.findByInstallerId(installerId, pageable).map(this::toDto);
    }

    @GetMapping("/admin/list")
    public Page<InvoiceDto> getAllInvoicesForAdmin(
            @RequestHeader("X-User-Role") String userRole,
            Pageable pageable) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        return invoiceRepository.findAll(pageable).map(this::toDto);
    }

    @GetMapping("/client/list")
    public Page<InvoiceDto> getInvoicesByClient(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            Pageable pageable) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "ADMIN");
        if ("ADMIN".equalsIgnoreCase(userRole)) {
            return invoiceRepository.findAll(pageable).map(this::toDto);
        }

        List<String> clientIds = new ArrayList<>();
        clientIds.add(userId);
        clientRepository.findByUserId(userId).ifPresent(c -> clientIds.add(String.valueOf(c.getId())));

        return invoiceRepository.findByClientIdIn(clientIds, pageable).map(this::toDto);
    }

    @PostMapping("/{id}/send")
    public InvoiceDto sendInvoiceToProjectActors(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");

        InvoiceEntity inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));

        inv.setStatus(InvoiceEntity.InvoiceStatus.SENT);
        InvoiceEntity updated = invoiceRepository.save(inv);

        String message = String.format("La facture %s est disponible dans votre espace.", updated.getNumber());
        String clientReceiver = resolveClientReceiverId(updated);
        notificationWebSocketService.notifyUser(clientReceiver, "Facture envoyée", message);

        if (updated.getInstallerId() != null && !updated.getInstallerId().isBlank()) {
            notificationWebSocketService.notifyUser(updated.getInstallerId(), "Facture envoyée", message);
        }

        return toDto(updated);
    }

    @PatchMapping("/{id}/status")
    public InvoiceDto updateInvoiceStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        InvoiceEntity inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + id));
        try {
            inv.setStatus(InvoiceEntity.InvoiceStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid invoice status: " + status);
        }
        return toDto(invoiceRepository.save(inv));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInvoice(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "INSTALLER", "ADMIN");
        if (!invoiceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Invoice not found: " + id);
        }
        invoiceRepository.deleteById(id);
    }

    private InvoiceDto toDto(InvoiceEntity i) {
        return new InvoiceDto(
                String.valueOf(i.getId()),
                i.getNumber(),
                i.getDate(),
                i.getDueDate(),
                i.getAmount().doubleValue(),
                i.getStatus().name()
        );
    }

    private void assertInvoiceAccess(InvoiceEntity invoice, String userId, String userRole) {
        if (!canAccessInvoice(invoice, userId, userRole)) {
            throw new ResourceNotFoundException("Invoice not found: " + invoice.getId());
        }
    }

    private boolean canAccessInvoice(InvoiceEntity invoice, String userId, String userRole) {
        if ("ADMIN".equalsIgnoreCase(userRole)) {
            return true;
        }

        if ("INSTALLER".equalsIgnoreCase(userRole)) {
            return userId != null && userId.equals(invoice.getInstallerId());
        }

        if ("CLIENT".equalsIgnoreCase(userRole)) {
            if (userId == null) {
                return false;
            }

            if (userId.equals(invoice.getClientId())) {
                return true;
            }

            Optional<Client> client = clientRepository.findByUserId(userId);
            return client.map(c -> String.valueOf(c.getId()).equals(invoice.getClientId())).orElse(false);
        }

        return false;
    }

    private String resolveClientReceiverId(InvoiceEntity invoice) {
        if (invoice.getClientId() != null && !invoice.getClientId().isBlank()) {
            Optional<Client> clientByUserId = clientRepository.findByUserId(invoice.getClientId());
            if (clientByUserId.isPresent()) {
                return invoice.getClientId();
            }

            try {
                Long clientPk = Long.parseLong(invoice.getClientId());
                return clientRepository.findById(clientPk)
                        .map(Client::getUserId)
                        .filter(id -> id != null && !id.isBlank())
                        .orElse(invoice.getClientId());
            } catch (NumberFormatException ignored) {
                return invoice.getClientId();
            }
        }
        return "0";
    }
}
