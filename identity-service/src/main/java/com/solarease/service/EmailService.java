package com.solarease.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@solarease.com");
            message.setTo(toEmail);
            message.setSubject("SolarEase - Vérification de votre email");
            message.setText(buildEmailBody(otpCode));

            mailSender.send(message);
            log.info("OTP email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email");
        }
    }

    private String buildEmailBody(String otpCode) {
        return "Bienvenue sur SolarEase!\n\n" +
                "Votre code de vérification est: " + otpCode + "\n\n" +
                "Ce code expire dans 5 minutes.\n\n" +
                "Ne partagez pas ce code avec quelqu'un d'autre.\n\n" +
                "Cordialement,\n" +
                "Équipe SolarEase";
    }

    public void sendWelcomeEmail(String toEmail, String firstName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@solarease.com");
            message.setTo(toEmail);
            message.setSubject("Bienvenue sur SolarEase!");
            message.setText("Bonjour " + firstName + ",\n\n" +
                    "Votre email a été vérifié avec succès.\n" +
                    "Vous pouvez maintenant vous connecter à votre compte.\n\n" +
                    "Bienvenue!");

            mailSender.send(message);
            log.info("Welcome email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email: {}", e.getMessage());
        }
    }
}
