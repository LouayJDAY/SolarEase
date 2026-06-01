package com.solarease.controller;

import com.solarease.dto.*;
import com.solarease.service.AuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@Slf4j
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ==================== HEALTH ====================

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Identity Service is running");
    }

    // ==================== AUTHENTICATION ====================

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("POST /api/auth/register - Inscription utilisateur");
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        log.info("POST /api/auth/verify-otp - Vérification OTP");
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/auth/login - Connexion utilisateur");
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("POST /api/auth/refresh - Rafraîchissement du token");
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/installers")
    public ResponseEntity<List<AuthResponse.UserDto>> listInstallers(
            @RequestHeader("X-User-Role") String userRole) {
        ensureAdminRole(userRole);
        log.info("GET /api/auth/installers - Liste des installateurs");
        return ResponseEntity.ok(authService.listInstallers());
    }

    @GetMapping("/clients")
    public ResponseEntity<List<AuthResponse.UserDto>> listClients(
            @RequestHeader("X-User-Role") String userRole) {
        ensureAdminRole(userRole);
        log.info("GET /api/auth/clients - Liste des clients");
        return ResponseEntity.ok(authService.listClients());
    }

    @PostMapping("/installers")
    public ResponseEntity<AuthResponse.UserDto> createInstaller(
            @RequestHeader("X-User-Role") String userRole,
            @Valid @RequestBody CreateInstallerRequest request) {
        ensureAdminRole(userRole);
        log.info("POST /api/auth/installers - Creation installateur");
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createInstaller(request));
    }

    @PutMapping("/installers/{installerUuid}")
    public ResponseEntity<AuthResponse.UserDto> updateInstaller(
            @RequestHeader("X-User-Role") String userRole,
            @PathVariable String installerUuid,
            @Valid @RequestBody UpdateInstallerRequest request) {
        ensureAdminRole(userRole);
        log.info("PUT /api/auth/installers/{} - Mise a jour installateur", installerUuid);
        return ResponseEntity.ok(authService.updateInstaller(installerUuid, request));
    }

    @DeleteMapping("/installers/{installerUuid}")
    public ResponseEntity<Void> deleteInstaller(
            @RequestHeader("X-User-Role") String userRole,
            @PathVariable String installerUuid) {
        ensureAdminRole(userRole);
        log.info("DELETE /api/auth/installers/{} - Suppression installateur", installerUuid);
        authService.deleteInstaller(installerUuid);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<AuthResponse> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        log.info("POST /api/auth/resend-otp - Renvoi OTP");
        AuthResponse response = authService.resendOtp(request);
        return ResponseEntity.ok(response);
    }

    // ==================== PROFILE MANAGEMENT ====================

    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> getProfile(@RequestHeader("X-User-Id") String userUuid) {
        log.info("GET /api/auth/me - Consultation profil");
        AuthResponse.UserDto profile = authService.getProfile(userUuid);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> updateProfile(
            @RequestHeader("X-User-Id") String userUuid,
            @Valid @RequestBody UpdateProfileRequest request) {
        log.info("PUT /api/auth/me - Mise à jour profil");
        AuthResponse.UserDto updated = authService.updateProfile(userUuid, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/me/password")
    public ResponseEntity<AuthResponse> changePassword(
            @RequestHeader("X-User-Id") String userUuid,
            @Valid @RequestBody ChangePasswordRequest request) {
        log.info("PUT /api/auth/me/password - Changement mot de passe");
        AuthResponse response = authService.changePassword(userUuid, request);
        return ResponseEntity.ok(response);
    }

    private void ensureAdminRole(String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
    }
}
