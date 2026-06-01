package com.solarease.config;

import com.solarease.entity.User;
import com.solarease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crée des comptes de démo (admin, installateur, client) avec des UUID fixes pour
 * les lier au project-service. Activé via {@code solarease.demo-seed=true}
 * (ex. {@code SOLAREASE_DEMO_SEED=true} dans Docker).
 */
@Component
@Order(100)
@ConditionalOnProperty(name = "solarease.demo-seed", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DemoAccountSeeder implements ApplicationRunner {

    public static final String DEMO_PASSWORD = "SolarEase123!";

    public static final String ADMIN_UUID = "00000000-0000-4000-8000-000000000001";
    public static final String INSTALLER_UUID = "00000000-0000-4000-8000-000000000002";
    public static final String CLIENT_UUID = "00000000-0000-4000-8000-000000000003";

    private static final String ADMIN_EMAIL = "admin@solarease.demo";
    private static final String INSTALLER_EMAIL = "installer.test@solarease.com";
    private static final String CLIENT_EMAIL = "client.demo@solarease.com";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("solarease.demo-seed=true — insertion des comptes démo (si absents)");
        ensureUser(
                ADMIN_UUID,
                "admin_demo",
                ADMIN_EMAIL,
                "Admin",
                "SolarEase",
                "+21600000001",
                User.UserRole.ADMIN
        );
        ensureUser(
                INSTALLER_UUID,
                "installer_test",
                INSTALLER_EMAIL,
                "Installateur",
                "Démo",
                "+21600000002",
                User.UserRole.INSTALLER
        );
        ensureUser(
                CLIENT_UUID,
                "client_demo",
                CLIENT_EMAIL,
                "Client",
                "Démo",
                "+21600000003",
                User.UserRole.CLIENT
        );
        log.info("Comptes démo — mot de passe pour tous: {}", DEMO_PASSWORD);
        log.info("  ADMIN      {} / {}", ADMIN_EMAIL, ADMIN_UUID);
        log.info("  INSTALLER  {} / {}", INSTALLER_EMAIL, INSTALLER_UUID);
        log.info("  CLIENT     {} / {}", CLIENT_EMAIL, CLIENT_UUID);
    }

    private void ensureUser(
            String uuid,
            String username,
            String email,
            String firstName,
            String lastName,
            String phone,
            User.UserRole role
    ) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User u = User.builder()
                .uuid(uuid)
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .firstName(firstName)
                .lastName(lastName)
                .phone(phone)
                .role(role)
                .isActive(true)
                .isEmailVerified(true)
                .build();
        userRepository.save(u);
        log.info("Créé utilisateur démo: {} ({})", email, role);
    }
}
