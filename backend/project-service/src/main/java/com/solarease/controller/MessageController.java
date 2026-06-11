package com.solarease.controller;

import com.solarease.dto.ConversationDto;
import com.solarease.dto.MessageDto;
import com.solarease.service.AccessControlService;
import com.solarease.service.ClientExtrasService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
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
        messageDto.setSenderRole(userRole);
        if (messageDto.getSenderId() == null) {
            messageDto.setSenderId(userId);
        }
        return clientExtrasService.sendProjectMessage(projectId, messageDto);
    }

    @PostMapping(value = "/{projectId}/messages/with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MessageDto sendProjectMessageWithAttachment(
            @PathVariable Long projectId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestPart("content") String content,
            @RequestPart(value = "senderId", required = false) String senderId,
            @RequestPart(value = "senderName", required = false) String senderName,
            @RequestPart(value = "recipientRoles", required = false) String recipientRolesCsv,
            @RequestPart("file") MultipartFile file) {
        accessControlService.requireAnyRole(userRole, "ADMIN", "INSTALLER", "CLIENT");
        log.info("POST /api/projects/{}/messages/with-attachment - User: {}, Role: {}", projectId, userId, userRole);

        MessageDto messageDto = new MessageDto();
        messageDto.setContent(content);
        messageDto.setSenderId(senderId != null ? senderId : userId);
        messageDto.setSenderName(senderName);
        messageDto.setSenderRole(userRole);
        if (recipientRolesCsv != null && !recipientRolesCsv.isBlank()) {
            messageDto.setRecipientRoles(
                    Arrays.stream(recipientRolesCsv.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isBlank())
                            .toList());
        }
        return clientExtrasService.sendProjectMessage(projectId, messageDto, file);
    }
}
