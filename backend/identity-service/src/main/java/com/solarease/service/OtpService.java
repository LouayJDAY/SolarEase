package com.solarease.service;

import com.solarease.entity.OtpToken;
import com.solarease.entity.User;
import com.solarease.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.otp.expiration:300}")
    private long otpExpirationSeconds;

    @Transactional
    public String generateAndSendOtp(User user) {
        otpTokenRepository.invalidateUnusedOtpsForUser(user);

        String otpCode = generateOtpCode();

        // Créer OtpToken
        OtpToken otpToken = OtpToken.builder()
                .user(user)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusSeconds(otpExpirationSeconds))
                .isUsed(false)
                .build();

        otpTokenRepository.save(otpToken);

        // Envoyer email avec OTP (si échec SMTP, on remonte l'erreur)
        emailService.sendOtpEmail(user.getEmail(), otpCode);

        log.info("OTP generated for {}: {}", user.getEmail(), otpCode);
        return otpCode;
    }

    public Optional<String> findLatestOtpCode(User user) {
        return otpTokenRepository.findTopByUserAndIsUsedFalseOrderByCreatedAtDesc(user)
                .map(OtpToken::getOtpCode);
    }

    public boolean validateOtp(String email, String otpCode) {
        OtpToken otpToken = otpTokenRepository.findByOtpCode(otpCode)
                .orElseThrow(() -> new RuntimeException("OTP invalide"));

        if (!otpToken.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Email ne correspond pas au OTP");
        }

        if (!otpToken.isValid()) {
            throw new RuntimeException("OTP expiré ou déjà utilisé");
        }

        // Marquer OTP comme utilisé
        otpToken.setIsUsed(true);
        otpTokenRepository.save(otpToken);

        log.info("OTP validated for: {}", email);
        return true;
    }

    private String generateOtpCode() {
        int otp = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(otp);
    }
}
