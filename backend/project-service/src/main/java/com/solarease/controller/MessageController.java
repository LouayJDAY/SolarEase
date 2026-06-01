package com.solarease.controller;

import com.solarease.dto.ConversationDto;
import com.solarease.dto.MessageDto;
import com.solarease.service.AccessControlService;
import com.solarease.service.ClientExtrasService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final ClientExtrasService clientExtrasService;
    private final AccessControlService accessControlService;

    @GetMapping("/{projectId}/messages")
    public List<ConversationDto> getProjectConversations(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "ADMIN", "INSTALLER", "CLIENT");
        log.info("GET /api/projects/{}/messages - User: {}, Role: {}", projectId, userId, userRole);
        return clientExtrasService.getProjectConversations(projectId, userId, userRole);
    }

    @PostMapping("/{projectId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageDto sendProjectMessage(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestBody @Valid MessageDto messageDto) {
        accessControlService.requireAnyRole(userRole, "ADMIN", "INSTALLER", "CLIENT");
        log.info("POST /api/projects/{}/messages - User: {}, Role: {}", projectId, userId, userRole);
        return clientExtrasService.sendProjectMessage(projectId, messageDto);
    }
}
