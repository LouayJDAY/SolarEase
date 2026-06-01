package com.solarease.controller;

import com.solarease.dto.NotificationDto;
import com.solarease.dto.SendNotificationRequest;
import com.solarease.entity.NotificationEntity;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.NotificationRepository;
import com.solarease.repository.ProjectRepository;
import com.solarease.service.AccessControlService;
import com.solarease.service.NotificationWebSocketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final AccessControlService accessControlService;
    private final NotificationWebSocketService notificationService;
    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;

    @GetMapping
    public List<NotificationDto> getMyNotifications(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        return notificationRepository.findByClientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        notificationRepository.findById(id).ifPresent(n -> {
            n.setReadFlag(true);
            notificationRepository.save(n);
        });
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllAsRead(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        List<NotificationEntity> unread = notificationRepository
                .findByClientIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !n.isReadFlag())
                .collect(Collectors.toList());
        unread.forEach(n -> n.setReadFlag(true));
        notificationRepository.saveAll(unread);
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole) {
        accessControlService.requireAnyRole(userRole, "CLIENT", "INSTALLER", "ADMIN");
        return notificationRepository.findByClientIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !n.isReadFlag()).count();
    }

    @PostMapping("/send")
    public Map<String, String> sendNotification(
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody SendNotificationRequest req) {

        accessControlService.requireAnyRole(userRole, "ADMIN");

        List<String> targets = resolveTargets(req);
        if (targets.isEmpty()) {
            log.warn("sendNotification: no targets resolved for request {}", req);
            return Map.of("status", "NO_TARGETS");
        }
        targets.forEach(uid -> notificationService.notifyUser(uid, req.getTitle(), req.getMessage()));
        log.info("Admin sent notification '{}' to {} recipient(s)", req.getTitle(), targets.size());
        return Map.of("status", "OK", "recipients", String.valueOf(targets.size()));
    }

    private List<String> resolveTargets(SendNotificationRequest req) {
        List<String> uids = new ArrayList<>();
        if ("USER".equalsIgnoreCase(req.getTargetType())) {
            if (req.getTargetUserId() != null && !req.getTargetUserId().isBlank()) {
                uids.add(req.getTargetUserId());
            }
        } else if ("ROLE_IN_PROJECT".equalsIgnoreCase(req.getTargetType()) && req.getProjectId() != null) {
            projectRepository.findById(req.getProjectId()).ifPresent(project -> {
                String role = req.getTargetRole() == null ? "ALL" : req.getTargetRole().toUpperCase();
                boolean all = "ALL".equals(role);

                if ((all || "INSTALLER".equals(role)) && project.getInstallerId() != null) {
                    uids.add(project.getInstallerId());
                }
                if ((all || "ADMIN".equals(role)) && project.getAssignedByAdminId() != null) {
                    uids.add(project.getAssignedByAdminId());
                }
                if ((all || "CLIENT".equals(role)) && project.getClientId() != null) {
                    clientRepository.findById(project.getClientId())
                            .filter(c -> c.getUserId() != null)
                            .ifPresent(c -> uids.add(c.getUserId()));
                }
            });
        }
        return uids;
    }

    private NotificationDto toDto(NotificationEntity n) {
        return new NotificationDto(
                String.valueOf(n.getId()),
                n.getTitle(),
                n.getMessage(),
                n.isReadFlag(),
                n.getCreatedAt()
        );
    }
}
