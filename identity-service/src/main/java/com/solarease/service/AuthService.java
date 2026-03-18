package com.solarease.service;

import com.solarease.dto.*;
import com.solarease.entity.User;
import com.solarease.exception.BadRequestException;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.UserRepository;
import com.solarease.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, 
                      PasswordEncoder passwordEncoder,
                      JwtTokenProvider jwtTokenProvider,
                      OtpService otpService,
                      EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.otpService = otpService;
        this.emailService = emailService;
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

    public AuthResponse register(RegisterRequest request) {
        log.info("Register attempt for email: {}", request.getEmail());
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }

        User newUser = User.builder()
                .uuid(java.util.UUID.randomUUID().toString())
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(User.UserRole.INSTALLER)
                .isActive(true)
                .isEmailVerified(true)
                .build();

        User savedUser = userRepository.save(newUser);

        log.info("User {} registered successfully (auto-verified)", savedUser.getEmail());
        
        return AuthResponse.builder()
                .message("User registered successfully. Please verify your email with the OTP code sent.")
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

        // Send welcome email
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());

        log.info("Email verified for user: {}", request.getEmail());

        return AuthResponse.builder()
                .message("Email verified successfully! You can now login.")
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

        otpService.generateAndSendOtp(user);

        log.info("OTP resent to: {}", request.getEmail());
        return AuthResponse.builder()
                .message("Un nouveau code OTP a été envoyé à votre email")
                .email(request.getEmail())
                .build();
    }
}
