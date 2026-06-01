package com.solarease.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class InvitationService {

    private final Optional<JavaMailSender> mailSender;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${app.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${app.twilio.phone-number:}")
    private String twilioPhoneNumber;

    @Autowired(required = false)
    public InvitationService(JavaMailSender mailSenderInput) {
        this.mailSender = Optional.ofNullable(mailSenderInput);
    }

    public InvitationService() {
        this.mailSender = Optional.empty();
    }

    /**
     * Returns true only when both the mail bean and SMTP credentials are present.
     * Spring Boot creates a JavaMailSender bean as soon as spring.mail.host is set,
     * even with empty username/password — so isPresent() alone is not sufficient.
     */
    private boolean isMailConfigured() {
        return mailSender.isPresent()
                && mailFrom != null && !mailFrom.isBlank();
    }

    /**
     * Send client invitation by email with registration link and quote
     */
    public void sendInvitationEmail(String clientEmail, String clientName, 
                                     Long demandId, Long projectId, String message) {
        if (!isMailConfigured()) {
            log.warn("Mail not configured (missing credentials). Skipping email to: {} for project: {}", clientEmail, projectId);
            return;
        }

        try {
            String registrationToken = generateRegistrationToken(clientEmail);
            String registrationLink = generateRegistrationLink(registrationToken, projectId);

            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(mailFrom);
            mailMessage.setTo(clientEmail);
            mailMessage.setSubject("SolarEase - Votre devis solaire est prêt ☀️");
            
            String emailBody = buildInvitationEmailBody(clientName, projectId, 
                                                        registrationLink, message);
            mailMessage.setText(emailBody);

            mailSender.get().send(mailMessage);
            log.info("Invitation email sent to: {} for project: {}", clientEmail, projectId);
        } catch (Exception e) {
            log.error("Failed to send invitation email to {}: {}", clientEmail, e.getMessage());
            throw new RuntimeException("Impossible d'envoyer l'email d'invitation: " + e.getMessage());
        }
    }

    /**
     * Send quick notification SMS with registration link
     */
    public void sendInvitationSms(String phoneNumber, String clientName, Long projectId) {
        if (twilioAccountSid == null || twilioAccountSid.isEmpty()) {
            log.warn("Twilio not configured. Skipping SMS for: {}", phoneNumber);
            return;
        }

        try {
            String shortCode = generateShortCode(projectId);
            String smsBody = buildInvitationSmsBody(clientName, shortCode);

            log.info("SMS would be sent to: {} with content: {}", phoneNumber, smsBody);
            
        } catch (Exception e) {
            log.error("Failed to send invitation SMS to {}: {}", phoneNumber, e.getMessage());
        }
    }

    /**
     * Send both email and SMS invitations
     */
    public void sendInvitationOmniChannel(String clientEmail, String phoneNumber, 
                                         String clientName, Long demandId, 
                                         Long projectId, String message, 
                                         boolean sendEmail, boolean sendSms) {
        if (sendEmail) {
            sendInvitationEmail(clientEmail, clientName, demandId, projectId, message);
        }
        
        if (sendSms && phoneNumber != null && !phoneNumber.isEmpty()) {
            sendInvitationSms(phoneNumber, clientName, projectId);
        }

        log.info("Omnichannel invitation sent to client: {} (email: {}, sms: {})", 
                 clientName, sendEmail, sendSms);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private String generateRegistrationToken(String email) {
        return UUID.randomUUID().toString();
    }

    private String generateRegistrationLink(String token, Long projectId) {
        String base = String.format("%s/register?token=%s", frontendUrl, token);
        return projectId != null ? base + "&projectId=" + projectId : base;
    }

    private String generateShortCode(Long projectId) {
        if (projectId == null) return "PRJ-NOUVEAU";
        return "PRJ" + String.format("%06d", projectId % 1000000);
    }

    private String buildInvitationEmailBody(String clientName, Long projectId, 
                                           String registrationLink, String adminMessage) {
        String projectRef = projectId != null ? "PRJ-" + projectId : "à définir";
        return "Bonjour " + clientName + ",\n\n" +
               "Votre demande pour un système solaire a été validée et votre devis est prêt! ☀️\n\n" +
               "=== DÉTAILS DE VOTRE PROJET ===\n" +
               "Référence du projet: " + projectRef + "\n\n" +
               "=== ÉTAPE SUIVANTE ===\n" +
               "Pour consulter votre devis et suivre votre projet en détail, veuillez créer un compte:\n\n" +
               registrationLink + "\n\n" +
               (adminMessage != null && !adminMessage.isEmpty() ? 
                "=== MESSAGE DE L'ÉQUIPE SOLAREASE ===\n" + adminMessage + "\n\n" : "") +
               "Une fois votre compte créé, vous pourrez:\n" +
               "✓ Télécharger votre devis au format PDF\n" +
               "✓ Suivre l'avancement de votre installation\n" +
               "✓ Communiquer directement avec votre installateur\n" +
               "✓ Accéder à tous les documents du projet\n\n" +
               "Questions? Notre équipe est à votre écoute:\n" +
               "📧 contact@solarease.tn\n" +
               "📞 +216 71 123 456\n\n" +
               "Cordialement,\n" +
               "L'équipe SolarEase\n" +
               "☀️ Ensemble pour l'énergie solaire!";
    }

    private String buildInvitationSmsBody(String clientName, String projectCode) {
        return "Bonjour " + clientName + ", votre devis SolarEase est prêt! 🌞\n" +
               "Projet: " + projectCode + "\n" +
               "Créez votre compte: solarease.tn/register\n" +
               "Questions? +216 71 123 456";
    }
}
