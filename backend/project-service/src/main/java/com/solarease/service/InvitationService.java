package com.solarease.service;

import com.solarease.entity.Client;
import com.solarease.entity.ClientInvitation;
import com.solarease.entity.DemandEntity;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientInvitationRepository;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.DemandRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class InvitationService {

    private static final int INVITATION_VALIDITY_DAYS = 14;

    private final Optional<JavaMailSender> mailSender;
    private final ClientInvitationRepository invitationRepository;
    private final ClientRepository clientRepository;
    private final DemandRepository demandRepository;
    private final IdentityServiceClient identityServiceClient;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.twilio.account-sid:}")
    private String twilioAccountSid;

    @Autowired
    public InvitationService(JavaMailSender mailSenderInput,
                           ClientInvitationRepository invitationRepository,
                           ClientRepository clientRepository,
                           DemandRepository demandRepository,
                           IdentityServiceClient identityServiceClient) {
        this.mailSender = Optional.ofNullable(mailSenderInput);
        this.invitationRepository = invitationRepository;
        this.clientRepository = clientRepository;
        this.demandRepository = demandRepository;
        this.identityServiceClient = identityServiceClient;
    }

    /**
     * Send invitation after public demand conversion when the client has no portal account.
     */
    @Transactional
    public ClientInvitation sendInvitationForDemand(DemandEntity demand, Client client, Long projectId) {
        if (client.getUserId() != null && !client.getUserId().isBlank()) {
            log.info("Client {} already has userId — skipping invitation", client.getId());
            return null;
        }
        String clientName = buildClientName(client);
        return sendInvitationEmail(
                client.getEmail(),
                clientName,
                demand.getId(),
                projectId,
                client.getId(),
                null
        );
    }

    /**
     * Resend invitation for an existing validated demand (admin action).
     */
    @Transactional
    public ClientInvitation resendInvitationForDemand(DemandEntity demand, Long projectId, String message) {
        if (demand.getClientEmail() == null || demand.getClientEmail().isBlank()) {
            throw new IllegalArgumentException("Demand has no client email");
        }
        Client client = clientRepository.findByEmail(demand.getClientEmail().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Client not found for demand email"));
        if (client.getUserId() != null && !client.getUserId().isBlank()) {
            throw new IllegalArgumentException("Client already has an active account");
        }
        String clientName = buildClientName(client);
        return sendInvitationEmail(
                client.getEmail(),
                clientName,
                demand.getId(),
                projectId,
                client.getId(),
                message
        );
    }

    @Transactional
    public ClientInvitation sendInvitationEmail(String clientEmail,
                                               String clientName,
                                               Long demandId,
                                               Long projectId,
                                               Long clientId,
                                               String adminMessage) {
        if (!isMailConfigured()) {
            throw new IllegalStateException(
                    "SMTP non configuré sur le serveur. Configurez SPRING_MAIL_USERNAME et SPRING_MAIL_PASSWORD.");
        }

        String normalizedEmail = clientEmail.trim().toLowerCase(Locale.ROOT);
        String token = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        ClientInvitation invitation = ClientInvitation.builder()
                .token(token)
                .email(normalizedEmail)
                .clientId(clientId)
                .projectId(projectId)
                .demandId(demandId)
                .expiresAt(now.plusDays(INVITATION_VALIDITY_DAYS))
                .sentAt(now)
                .build();
        invitationRepository.save(invitation);

        boolean hasPortalAccount = resolveHasPortalAccount(clientId, normalizedEmail);
        String invitationLink = generateInvitationLink(token, normalizedEmail, projectId, hasPortalAccount);

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(mailFrom);
            mailMessage.setTo(normalizedEmail);
            mailMessage.setSubject(hasPortalAccount
                    ? "SolarEase - Accédez à votre projet ☀️"
                    : "SolarEase - Créez votre espace client ☀️");
            mailMessage.setText(buildInvitationEmailBody(
                    clientName, projectId, invitationLink, adminMessage, hasPortalAccount));
            mailSender.get().send(mailMessage);
            log.info("Invitation email sent to {} for project {}", normalizedEmail, projectId);
            return invitation;
        } catch (Exception e) {
            log.error("Failed to send invitation email to {}: {}", normalizedEmail, e.getMessage());
            throw new IllegalStateException("Impossible d'envoyer l'email d'invitation: " + e.getMessage());
        }
    }

    public void sendInvitationOmniChannel(String clientEmail,
                                          String phoneNumber,
                                          String clientName,
                                          Long demandId,
                                          Long projectId,
                                          String message,
                                          boolean sendEmail,
                                          boolean sendSms) {
        if (sendEmail) {
            Client client = clientRepository.findByEmail(clientEmail.trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + clientEmail));
            sendInvitationEmail(clientEmail, clientName, demandId, projectId, client.getId(), message);
        }
        if (sendSms && phoneNumber != null && !phoneNumber.isBlank()) {
            sendInvitationSms(phoneNumber, clientName, projectId);
        }
    }

    public void sendInvitationSms(String phoneNumber, String clientName, Long projectId) {
        if (twilioAccountSid == null || twilioAccountSid.isEmpty()) {
            log.warn("Twilio not configured. Skipping SMS for: {}", phoneNumber);
            return;
        }
        log.info("SMS would be sent to: {} for project {}", phoneNumber, projectId);
    }

    public boolean hasActiveInvitation(Long demandId) {
        return invitationRepository.findTopByDemandIdOrderBySentAtDesc(demandId)
                .map(inv -> !inv.isUsed() && !inv.isExpired())
                .orElse(false);
    }

    public Optional<LocalDateTime> latestInvitationSentAt(Long demandId) {
        return invitationRepository.findTopByDemandIdOrderBySentAtDesc(demandId)
                .map(ClientInvitation::getSentAt);
    }

    private boolean isMailConfigured() {
        return mailSender.isPresent() && mailFrom != null && !mailFrom.isBlank();
    }

    private boolean resolveHasPortalAccount(Long clientId, String normalizedEmail) {
        if (clientId != null) {
            Optional<Client> client = clientRepository.findById(clientId);
            if (client.isPresent()) {
                String userId = client.get().getUserId();
                if (userId != null && !userId.isBlank()) {
                    return true;
                }
            }
        }
        return identityServiceClient.emailHasPortalAccount(normalizedEmail);
    }

    private String generateInvitationLink(String token, String email, Long projectId, boolean hasPortalAccount) {
        String path = hasPortalAccount ? "login" : "register";
        String base = String.format("%s/%s?token=%s&email=%s", frontendUrl, path, token, email);
        return projectId != null ? base + "&projectId=" + projectId : base;
    }

    private String buildClientName(Client client) {
        return (safe(client.getFirstName()) + " " + safe(client.getLastName())).trim();
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String buildInvitationEmailBody(String clientName,
                                            Long projectId,
                                            String invitationLink,
                                            String adminMessage,
                                            boolean hasPortalAccount) {
        String projectRef = projectId != null ? "PRJ-" + projectId : "à définir";
        String actionSection = hasPortalAccount
                ? "=== ACCÉDER À VOTRE PROJET ===\n"
                + "Votre fiche client a été créée. Connectez-vous avec votre compte SolarEase existant "
                + "pour lier ce projet à votre espace :\n\n"
                : "=== CRÉER VOTRE COMPTE CLIENT ===\n"
                + "Pour consulter votre projet, recevoir vos devis et suivre l'installation :\n\n";
        return "Bonjour " + clientName + ",\n\n"
                + "Votre demande solaire a été validée et votre projet est prêt sur SolarEase.\n\n"
                + "=== VOTRE PROJET ===\n"
                + "Référence : " + projectRef + "\n\n"
                + actionSection
                + invitationLink + "\n\n"
                + (adminMessage != null && !adminMessage.isBlank()
                ? "=== MESSAGE DE L'ÉQUIPE ===\n" + adminMessage + "\n\n" : "")
                + "Ce lien est valable " + INVITATION_VALIDITY_DAYS + " jours.\n\n"
                + "Cordialement,\n"
                + "L'équipe SolarEase";
    }
}
