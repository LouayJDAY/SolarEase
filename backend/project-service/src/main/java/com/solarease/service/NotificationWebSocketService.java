package com.solarease.service;

import com.solarease.dto.DemandDTO;
import com.solarease.entity.NotificationEntity;
import com.solarease.enums.DemandStatus;
import com.solarease.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    /**
     * Virtual user-id used to persist the "new demand" bell entry visible to every
     * connected admin. Each admin's frontend fetches notifications targeted at this
     * virtual id when the user has role ADMIN.
     */
    public static final String ADMIN_BROADCAST_USER_ID = "ADMIN_BROADCAST";

    /** STOMP topic broadcasting demand events to every subscribed admin. */
    public static final String ADMIN_DEMANDS_TOPIC = "/topic/admin/demands";

    /** STOMP topic telling every subscribed admin dashboard to reload its KPIs. */
    public static final String ADMIN_DASHBOARD_TOPIC = "/topic/admin/dashboard";

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    public void notifyUser(String userId, String title, String message) {
        NotificationEntity notification = NotificationEntity.builder()
                .clientId(userId)
                .title(title)
                .message(message)
                .readFlag(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", notification.getId());
        payload.put("title", title);
        payload.put("message", message);
        payload.put("read", false);
        payload.put("createdAt", notification.getCreatedAt().toString());

        try {
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", payload);
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, payload);
            log.debug("WebSocket notification sent to user {}: {}", userId, title);
        } catch (Exception e) {
            log.warn("Could not send WebSocket notification to user {}: {}", userId, e.getMessage());
        }
    }

    public void notifyQuoteSent(String clientId, String quoteNumber, Long projectId) {
        notifyUser(clientId,
                "Nouveau devis reçu",
                String.format("Le devis %s pour le projet #%d vous a été envoyé. Cliquez pour consulter.",
                        quoteNumber, projectId));
    }

    public void notifyQuoteAccepted(String installerId, String quoteNumber) {
        notifyUser(installerId,
                "Devis accepté",
                String.format("Le client a accepté le devis %s. Une facture a été générée.", quoteNumber));
    }

    public void notifyQuoteRejected(String installerId, String quoteNumber, String reason) {
        String msg = String.format("Le client a refusé le devis %s.", quoteNumber);
        if (reason != null && !reason.isBlank()) {
            msg += " Motif : " + reason;
        }
        notifyUser(installerId, "Devis refusé", msg);
    }

    public void notifyInvoiceGenerated(String clientId, String invoiceNumber) {
        notifyUser(clientId,
                "Nouvelle facture disponible",
                String.format("La facture %s a été générée et est disponible dans votre espace.", invoiceNumber));
    }

    public void notifyProjectStatusChanged(String clientId, String projectName, String newStatus) {
        String label = switch (newStatus) {
            case "IN_PROGRESS" -> "en cours";
            case "COMPLETED" -> "terminé";
            case "CANCELLED" -> "annulé";
            default -> newStatus;
        };
        notifyUser(clientId,
                "Statut de projet mis à jour",
                String.format("Votre projet « %s » est maintenant %s.", projectName, label));
    }

    public void notifyNewMessage(String userId, String senderName, String projectName) {
        notifyUser(userId,
                "Nouveau message",
                String.format("%s vous a envoyé un message concernant le projet « %s ».", senderName, projectName));
    }

    public void notifySupportTicketCreated(String installerId, String clientName, String subject, Long ticketId) {
        notifyUser(installerId,
                "Nouveau ticket support",
                String.format("%s a ouvert le ticket « %s » (#%d).", clientName, subject, ticketId));
    }

    /** Bell notification visible to every admin (virtual broadcast user). */
    public void notifySupportTicketCreatedForAdmin(String clientName, String subject, Long ticketId) {
        notifyUser(ADMIN_BROADCAST_USER_ID,
                "Nouveau ticket support",
                String.format("%s a ouvert le ticket « %s » (#%d). Consultez l'espace Support.", clientName, subject, ticketId));
    }

    // ── Demand inbox notifications ────────────────────────────────────────────

    /**
     * Broadcast a "new demand" event to every connected admin (live STOMP frame)
     * and persist a single bell entry under the virtual {@link #ADMIN_BROADCAST_USER_ID}
     * recipient. The frontend admin Inbox plays a sound and prepends the new
     * demand to the list without reloading.
     */
    /**
     * Push a lightweight refresh signal so connected admin dashboards reload stats
     * without waiting for the HTTP polling interval.
     */
    public void notifyAdminDashboardRefresh(String event) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", event);
        payload.put("timestamp", LocalDateTime.now().toString());
        try {
            messagingTemplate.convertAndSend(ADMIN_DASHBOARD_TOPIC, payload);
            log.debug("Admin dashboard refresh broadcast: {}", event);
        } catch (Exception e) {
            log.warn("Failed to broadcast admin dashboard refresh ({}): {}", event, e.getMessage());
        }
    }

    /**
     * Notify a specific installer dashboard (scoped stats) and the global admin view.
     */
    public void notifyDashboardRefresh(String event, String installerId) {
        notifyAdminDashboardRefresh(event);
        if (installerId == null || installerId.isBlank()) {
            return;
        }
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", event);
        payload.put("installerId", installerId);
        payload.put("timestamp", LocalDateTime.now().toString());
        try {
            messagingTemplate.convertAndSend(
                    "/topic/installer/" + installerId + "/dashboard", payload);
            log.debug("Installer dashboard refresh broadcast: {} -> {}", event, installerId);
        } catch (Exception e) {
            log.warn("Failed to broadcast installer dashboard refresh for {}: {}",
                    installerId, e.getMessage());
        }
    }

    public void notifyAdminsOnNewDemand(DemandDTO demand) {
        if (demand == null) {
            return;
        }

        String clientName = displayName(demand);
        String sourceLabel = demand.getSource() == null ? "" :
                switch (demand.getSource()) {
                    case PUBLIC -> " (formulaire public)";
                    case CLIENT -> " (portail client)";
                };
        String title = "Nouvelle demande" + sourceLabel;
        String message = String.format("%s — « %s »",
                clientName.isBlank() ? "Prospect" : clientName,
                safeName(demand.getName()));

        // 1) Persist a notification entry visible to every admin via the virtual id.
        NotificationEntity notification = NotificationEntity.builder()
                .clientId(ADMIN_BROADCAST_USER_ID)
                .title(title)
                .message(message)
                .readFlag(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);

        // 2) Live STOMP push on the admin topic. The frame carries minimal data --
        //    the detail panel always reloads via GET /api/demands/{id}.
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", "DEMAND_CREATED");
        payload.put("notificationId", notification.getId());
        payload.put("demandId", demand.getId());
        payload.put("name", demand.getName());
        payload.put("status", demand.getStatus() == null ? null : demand.getStatus().name());
        payload.put("source", demand.getSource() == null ? null : demand.getSource().name());
        payload.put("priority", demand.getPriority() == null ? null : demand.getPriority().name());
        payload.put("clientFirstName", demand.getClientFirstName());
        payload.put("clientLastName", demand.getClientLastName());
        payload.put("clientEmail", demand.getClientEmail());
        payload.put("createdAt", demand.getCreatedAt() == null ? null : demand.getCreatedAt().toString());

        try {
            messagingTemplate.convertAndSend(ADMIN_DEMANDS_TOPIC, payload);
        } catch (Exception e) {
            log.warn("Failed to broadcast new-demand event for demand {}: {}", demand.getId(), e.getMessage());
        }
        notifyAdminDashboardRefresh("DEMAND_CREATED");
    }

    /**
     * Notify the originating client when their demand changes status. Public
     * prospects (clientUserId starting with "PUBLIC:") have no STOMP session and
     * no bell -- the email follow-up is handled separately by InvitationService.
     */
    public void notifyDemandStatusChange(DemandDTO demand) {
        if (demand == null || demand.getStatus() == null) {
            return;
        }
        String userId = demand.getClientUserId();
        if (userId == null || userId.isBlank() || userId.startsWith("PUBLIC:")) {
            return;
        }

        String demandLabel = safeName(demand.getName());
        String title;
        String message;
        switch (demand.getStatus()) {
            case A_COMPLETER -> {
                title = "Demande à compléter";
                message = String.format("Votre demande « %s » nécessite des informations complémentaires. %s",
                        demandLabel,
                        demand.getAdminNote() == null ? "" : "Note : " + demand.getAdminNote());
            }
            case VALIDEE -> {
                title = "Demande validée";
                message = demand.getProjectId() != null
                        ? String.format("Votre demande « %s » a été validée et convertie en projet #%d.", demandLabel, demand.getProjectId())
                        : String.format("Votre demande « %s » a été validée.", demandLabel);
            }
            case REJETEE -> {
                title = "Demande rejetée";
                message = demand.getRejectionReason() == null || demand.getRejectionReason().isBlank()
                        ? String.format("Votre demande « %s » a été rejetée.", demandLabel)
                        : String.format("Votre demande « %s » a été rejetée. Motif : %s", demandLabel, demand.getRejectionReason());
            }
            case NOUVELLE -> {
                // Status was reset -- not surfacing to the user.
                return;
            }
            default -> {
                title = "Mise à jour de votre demande";
                message = String.format("Le statut de votre demande « %s » a changé.", demandLabel);
            }
        }

        notifyUser(userId, title, message);

        // Special-case: when the demand is fully approved and linked to a project,
        // mirror Spring's project-status nomenclature so existing client widgets light up.
        if (demand.getStatus() == DemandStatus.VALIDEE && demand.getProjectId() != null) {
            log.debug("Demand {} validation notification dispatched to {}", demand.getId(), userId);
        }
    }

    private static String displayName(DemandDTO d) {
        String first = d.getClientFirstName() == null ? "" : d.getClientFirstName().trim();
        String last  = d.getClientLastName()  == null ? "" : d.getClientLastName().trim();
        String joined = (first + " " + last).trim();
        if (!joined.isBlank()) return joined;
        return d.getClientEmail() == null ? "" : d.getClientEmail();
    }

    private static String safeName(String value) {
        return (value == null || value.isBlank()) ? "(sans titre)" : value;
    }
}
