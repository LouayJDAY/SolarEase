package com.solarease.controller;

import com.solarease.dto.*;
import com.solarease.service.AccessControlService;
import com.solarease.service.ClientExtrasService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients/{clientId}")
@RequiredArgsConstructor
public class ClientExtrasController {

    private final ClientExtrasService clientExtrasService;
    private final AccessControlService accessControlService;

    @GetMapping("/notifications")
    public List<NotificationDto> getNotifications(
            @PathVariable String clientId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        accessControlService.requireClientOwnsResource(userRole, userId, clientId);
        return clientExtrasService.getNotifications(clientId);
    }

    @PostMapping("/notifications/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markNotificationRead(
            @PathVariable String clientId,
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        accessControlService.requireClientOwnsResource(userRole, userId, clientId);
        // For now this is a stub — no-op
    }

    @GetMapping("/messages")
    public List<ConversationDto> getMessages(
            @PathVariable String clientId,
            @RequestParam(required = false) Long projectId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        accessControlService.requireClientOwnsResource(userRole, userId, clientId);
        return clientExtrasService.getConversations(clientId, projectId);
    }

    @PostMapping("/messages/{conversationId}")
    public MessageDto sendMessage(
            @PathVariable String clientId,
            @PathVariable String conversationId,
            @RequestParam(required = false) Long projectId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody MessageDto message) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        accessControlService.requireClientOwnsResource(userRole, userId, clientId);
        message.setSenderRole(userRole);
        return clientExtrasService.sendMessage(clientId, conversationId, projectId, message);
    }

    @GetMapping("/documents")
    public List<DocumentDto> getDocuments(
            @PathVariable String clientId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        accessControlService.requireClientOwnsResource(userRole, userId, clientId);
        return clientExtrasService.getDocuments(clientId);
    }

    @GetMapping("/invoices")
    public List<InvoiceDto> getInvoices(
            @PathVariable String clientId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        accessControlService.requireClientOwnsResource(userRole, userId, clientId);
        return clientExtrasService.getInvoices(clientId);
    }
}
