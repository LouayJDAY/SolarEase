package com.solarease.service;

import com.solarease.dto.*;
import com.solarease.entity.User;
import com.solarease.exception.BadRequestException;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.OtpTokenRepository;
import com.solarease.repository.UserRepository;
import com.solarease.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.List;

@Service
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;
    private final ProjectServiceClient projectServiceClient;
    private final OtpTokenRepository otpTokenRepository;

    public AuthService(UserRepository userRepository, 
                      PasswordEncoder passwordEncoder,
                      JwtTokenProvider jwtTokenProvider,
                      OtpService otpService,
                      EmailService emailService,
                      ProjectServiceClient projectServiceClient,
                      OtpTokenRepository otpTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.otpService = otpService;
        this.emailService = emailService;
        this.projectServiceClient = projectServiceClient;
        this.otpTokenRepository = otpTokenRepository;
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new BadRequestException("User account is inactive");
        }

        if (user.getRole() == User.UserRole.CLIENT
                && request.getInvitationToken() != null
                && !request.getInvitationToken().isBlank()) {
            projectServiceClient.linkClientAccount(
                    user.getUuid(),
                    user.getEmail(),
                    request.getInvitationToken()
            );
        }

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUuid(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUuid(), user.getEmail(), user.getRole().name());

        AuthResponse.UserDto userDto = buildUserDto(user);

        log.info("User {} logged in successfully", user.getEmail());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(userDto)
                .build();
    }

    public boolean emailExists(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return userRepository.existsByEmail(email.trim());
    }

    public AuthResponse register(RegisterRequest request) {
        log.info("Register attempt for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            User existing = userRepository.findByEmail(request.getEmail())
                    .orElseThrow();
            if (existing.getRole() != User.UserRole.CLIENT) {
                throw new BadRequestException(
                        "Email already registered as " + existing.getRole().name().toLowerCase(Locale.ROOT));
            }
            throw new BadRequestException("Email already registered");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }

        // Determine user role: default to CLIENT if not specified
        User.UserRole userRole = User.UserRole.CLIENT;
        if (request.getUserRole() != null && !request.getUserRole().isEmpty()) {
            try {
                userRole = User.UserRole.valueOf(request.getUserRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid user role: {}, defaulting to CLIENT", request.getUserRole());
                userRole = User.UserRole.CLIENT;
            }
        }

        User newUser = User.builder()
                .uuid(java.util.UUID.randomUUID().toString())
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(userRole)
                .isActive(true)
            .isEmailVerified(false)
                .build();

        User savedUser = userRepository.save(newUser);

        // Générer l'OTP et tenter l'envoi email sans bloquer l'inscription si SMTP échoue
        String message;
        String otpCode = null;
        try {
            otpCode = otpService.generateAndSendOtp(savedUser);
            message = "User registered successfully. Please verify your email with the OTP code sent.";
        } catch (RuntimeException e) {
            log.warn("OTP generation/email failed for {}: {}", savedUser.getEmail(), e.getMessage());
            message = "User registered successfully, but the OTP email could not be sent. You can request a new code later.";
            otpCode = getLatestOtpCode(savedUser);
        }

        log.info("User {} registered successfully (email not verified, OTP sent)", savedUser.getEmail());
        
        return AuthResponse.builder()
                .message(message)
                .email(savedUser.getEmail())
            .otpCode(otpCode)
                .build();
    }

    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        log.info("OTP verification attempt for email: {}", request.getEmail());

        // Validate OTP
        otpService.validateOtp(request.getEmail(), request.getOtpCode());

        // Mark email as verified
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsEmailVerified(true);
        userRepository.save(user);

        if (user.getRole() == User.UserRole.CLIENT) {
            projectServiceClient.linkClientAccount(
                    user.getUuid(),
                    user.getEmail(),
                    request.getInvitationToken()
            );
        }

        // Send welcome email
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());

        log.info("Email verified for user: {}", request.getEmail());

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUuid(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getUuid(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(buildUserDto(user))
                .message("Email verified successfully!")
                .email(request.getEmail())
                .build();
    }

    private AuthResponse.UserDto buildUserDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .role(user.getRole().toString())
                .isEmailVerified(user.getIsEmailVerified())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public List<AuthResponse.UserDto> listInstallers() {
        return userRepository.findAllByRole(User.UserRole.INSTALLER).stream()
                .map(this::buildUserDto)
                .toList();
    }

    public List<AuthResponse.UserDto> listClients() {
        return userRepository.findAllByRole(User.UserRole.CLIENT).stream()
                .map(this::buildUserDto)
                .toList();
    }

    public AuthResponse.UserDto createInstaller(CreateInstallerRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email deja utilise");
        }

        String username = generateUniqueUsername(request.getEmail(), request.getFirstName(), request.getLastName());

        User newInstaller = User.builder()
                .uuid(java.util.UUID.randomUUID().toString())
                .email(request.getEmail())
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(User.UserRole.INSTALLER)
                .isActive(true)
                .isEmailVerified(true)
                .build();

        User saved = userRepository.save(newInstaller);
        log.info("Installer created by admin: {} ({})", saved.getEmail(), saved.getUuid());
        return buildUserDto(saved);
    }

    public AuthResponse.UserDto updateInstaller(String installerUuid, UpdateInstallerRequest request) {
        log.debug("updateInstaller called: installerUuid={}, request={}", installerUuid, request);

        User installer = userRepository.findByUuid(installerUuid)
            .orElseThrow(() -> new ResourceNotFoundException("Installateur non trouve"));

        log.debug("Existing installer before update: email={}, username={}, isEmailVerified={}, isActive={}",
            installer.getEmail(), installer.getUsername(), installer.getIsEmailVerified(), installer.getIsActive());

        if (installer.getRole() != User.UserRole.INSTALLER) {
            throw new BadRequestException("L'utilisateur cible n'est pas un installateur");
        }

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(installer.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email deja utilise");
            }
            installer.setEmail(request.getEmail());
            installer.setUsername(generateUniqueUsername(request.getEmail(), installer.getFirstName(), installer.getLastName()));
            // Email changed -> require re-verification
            installer.setIsEmailVerified(false);
            try {
                otpService.generateAndSendOtp(installer);
                log.info("OTP resent to updated installer email: {}", installer.getEmail());
            } catch (RuntimeException e) {
                log.warn("Failed to send OTP after email update for {}: {}", installer.getEmail(), e.getMessage());
            }
        }

        if (request.getFirstName() != null) {
            installer.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            installer.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            installer.setPhone(request.getPhone());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            installer.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getIsActive() != null) {
            installer.setIsActive(request.getIsActive());
        }

        User saved = userRepository.save(installer);
        log.info("Installer updated by admin: {} ({})", saved.getEmail(), saved.getUuid());
        return buildUserDto(saved);
    }

    public void deleteInstaller(String installerUuid) {
        User installer = userRepository.findByUuid(installerUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Installateur non trouve"));

        if (installer.getRole() != User.UserRole.INSTALLER) {
            throw new BadRequestException("Suppression autorisee uniquement pour les installateurs");
        }

        otpTokenRepository.deleteByUser(installer);
        userRepository.delete(installer);
        log.info("Installer deleted by admin: {} ({})", installer.getEmail(), installer.getUuid());
    }

    /**
     * Supprime le compte portail CLIENT (identity) lors de la suppression d'une fiche client.
     * Appelé en interne par project-service — idempotent si aucun compte ne correspond.
     */
    public void deleteClientPortalAccount(String uuid, String email) {
        User clientUser = null;
        if (uuid != null && !uuid.isBlank()) {
            clientUser = userRepository.findByUuid(uuid.trim()).orElse(null);
        }
        if (clientUser == null && email != null && !email.isBlank()) {
            clientUser = userRepository.findByEmail(email.trim()).orElse(null);
        }
        if (clientUser == null) {
            log.info("No portal account to delete (uuid={}, email={})", uuid, email);
            return;
        }
        if (clientUser.getRole() != User.UserRole.CLIENT) {
            log.warn("Skipping portal delete — user {} is role {}, not CLIENT", clientUser.getEmail(), clientUser.getRole());
            return;
        }
        otpTokenRepository.deleteByUser(clientUser);
        userRepository.delete(clientUser);
        log.info("Client portal account deleted: {} ({})", clientUser.getEmail(), clientUser.getUuid());
    }

    private String generateUniqueUsername(String email, String firstName, String lastName) {
        String base = email != null && email.contains("@")
                ? email.substring(0, email.indexOf("@"))
                : ((firstName == null ? "" : firstName) + "." + (lastName == null ? "" : lastName));

        String normalizedBase = base
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", "")
                .replaceAll("\\.{2,}", ".")
                .replaceAll("_{2,}", "_")
                .replaceAll("-{2,}", "-")
                .replaceAll("^[._-]+|[._-]+$", "");

        if (normalizedBase.isBlank()) {
            normalizedBase = "installer";
        }

        String candidate = normalizedBase;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = normalizedBase + suffix;
            suffix++;
        }

        return candidate;
    }

    // ==================== PROFILE MANAGEMENT ====================

    public AuthResponse.UserDto getProfile(String userUuid) {
        log.info("Fetching profile for user: {}", userUuid);
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        return buildUserDto(user);
    }

    @Transactional
    public AuthResponse.UserDto updateProfile(String userUuid, UpdateProfileRequest request) {
        log.info("Updating profile for user: {}", userUuid);
        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getCompany() != null) {
            user.setCompanyId(null); // For now just log company name usage
        }

        User updated = userRepository.save(user);
        log.info("Profile updated for user: {}", userUuid);
        return buildUserDto(updated);
    }

    // ==================== PASSWORD MANAGEMENT ====================

    @Transactional
    public AuthResponse changePassword(String userUuid, ChangePasswordRequest request) {
        log.info("Password change attempt for user: {}", userUuid);

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Les mots de passe ne correspondent pas");
        }

        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Le mot de passe actuel est incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Le nouveau mot de passe doit être différent de l'ancien");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password changed for user: {}", userUuid);
        return AuthResponse.builder()
                .message("Mot de passe modifié avec succès")
                .build();
    }

    // ==================== TOKEN MANAGEMENT ====================

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        log.info("Token refresh attempt");

        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Refresh token invalide ou expiré");
        }

        String tokenType = jwtTokenProvider.getTokenType(refreshToken);
        if (!"REFRESH".equals(tokenType)) {
            throw new BadRequestException("Le token fourni n'est pas un refresh token");
        }

        String userUuid = jwtTokenProvider.getUserIdFromToken(refreshToken);
        String email = jwtTokenProvider.getEmailFromToken(refreshToken);

        User user = userRepository.findByUuid(userUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!user.getIsActive()) {
            throw new BadRequestException("Le compte est désactivé");
        }

        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getUuid(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getUuid(), user.getEmail(), user.getRole().name());

        log.info("Tokens refreshed for user: {}", email);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresIn(jwtTokenProvider.getExpirationTime())
                .user(buildUserDto(user))
                .build();
    }

    // ==================== OTP MANAGEMENT ====================

    public AuthResponse resendOtp(ResendOtpRequest request) {
        log.info("Resend OTP request for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé avec cet email"));

        if (user.getIsEmailVerified()) {
            throw new BadRequestException("L'email est déjà vérifié");
        }

        String message;
        String otpCode = null;
        try {
            otpCode = otpService.generateAndSendOtp(user);
            message = "Un nouveau code OTP a été envoyé à votre email";
        } catch (RuntimeException e) {
            log.warn("OTP resend failed for {}: {}", request.getEmail(), e.getMessage());
            message = "Le compte a bien été trouvé, mais l'email OTP n'a pas pu être envoyé. Réessayez plus tard.";
            otpCode = getLatestOtpCode(user);
        }

        log.info("OTP resent to: {}", request.getEmail());
        return AuthResponse.builder()
                .message(message)
                .email(request.getEmail())
                .otpCode(otpCode)
                .build();
    }

    private String getLatestOtpCode(User user) {
        return otpService.findLatestOtpCode(user).orElse(null);
    }
}
