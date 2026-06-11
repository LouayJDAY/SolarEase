package com.solarease.controller;

import com.solarease.dto.SupportTicketCreateRequest;
import com.solarease.dto.SupportTicketResponse;
import com.solarease.dto.SupportTicketUpdateRequest;
import com.solarease.service.AccessControlService;
import com.solarease.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService supportTicketService;
    private final AccessControlService accessControlService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupportTicketResponse createTicket(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid SupportTicketCreateRequest request) {
        accessControlService.requireAnyRole(userRole, "CLIENT");
        return supportTicketService.createTicket(userId, request);
    }

    @GetMapping
    public List<SupportTicketResponse> listMyTickets(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT");
        return supportTicketService.getTicketsForClient(userId);
    }

    @GetMapping("/admin/all")
    public List<SupportTicketResponse> listAllTickets(
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        return supportTicketService.getAllTicketsForAdmin();
    }

    @GetMapping("/admin/open-count")
    public Map<String, Long> openTicketCount(@RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        return Map.of("open", supportTicketService.countOpenTickets());
    }

    @GetMapping("/admin/{id}")
    public SupportTicketResponse getTicketForAdmin(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        return supportTicketService.getTicketByIdForAdmin(id);
    }

    @PatchMapping("/admin/{id}/status")
    public SupportTicketResponse updateTicketStatus(
            @PathVariable Long id,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid SupportTicketUpdateRequest request) {
        accessControlService.requireAnyRole(userRole, "ADMIN");
        return supportTicketService.updateTicketStatusForAdmin(id, request);
    }

    @GetMapping("/{id}")
    public SupportTicketResponse getTicket(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT");
        return supportTicketService.getTicketById(userId, id);
    }
}
