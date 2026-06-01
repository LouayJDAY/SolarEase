package com.solarease.config;

import com.solarease.dto.ProjectRequest;
import com.solarease.entity.Client;
import com.solarease.enums.ProjectStatus;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.ProjectRepository;
import com.solarease.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seed démo pour le project-service.
 *
 * Clients créés (idempotents par email) :
 *   - Client A : client.demo@solarease.com   — userId=CLIENT_USER_ID  (peut se connecter côté client)
 *   - Client B : prospect@solarease.demo      — sans userId            (fiche créée par l'installateur)
 *
 * Projets créés (idempotents par nom) :
 *   1. [INSTALLATEUR] Installation démo résidentielle 6 kWc     → Client A / installateur démo
 *   2. [INSTALLATEUR] Démo installateur — extension toiture 4 kWc → Client B / installateur démo
 *   3. [ADMIN]        Démo admin — centrale bâtiment 10 kWc       → Client A / installateur démo
 *                     (simule POST /api/projects/admin/assign avec installerId choisi par l'admin)
 *
 * Activé par : SOLAREASE_DEMO_SEED=true (docker-compose.yml)
 * Mot de passe de tous les comptes identity : SolarEase123!
 */
@Component
@Order(150)
@ConditionalOnProperty(name = "solarease.demo-seed", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DemoProjectSeeder implements ApplicationRunner {

    /* UUID alignés avec DemoAccountSeeder (identity-service) */
        public static final String ADMIN_USER_ID = "00000000-0000-4000-8000-000000000001";
    public static final String INSTALLER_USER_ID = "00000000-0000-4000-8000-000000000002";
    public static final String CLIENT_USER_ID    = "00000000-0000-4000-8000-000000000003";

        public static final String ADMIN_EMAIL = "admin@solarease.demo";
        public static final String INSTALLER_EMAIL = "installer.test@solarease.com";

    /* Emails clients */
    public static final String DEMO_CLIENT_EMAIL    = "client.demo@solarease.com";
    public static final String PROSPECT_CLIENT_EMAIL = "prospect@solarease.demo";

    /* Noms de projets (clé d'idempotence) */
    private static final String PROJECT_1 = "Installation démo résidentielle 6 kWc";
    private static final String PROJECT_2 = "Démo installateur — extension toiture 4 kWc";
    private static final String PROJECT_3 = "Démo admin — centrale bâtiment 10 kWc";

    private final ClientRepository  clientRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService    projectService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("solarease.demo-seed=true — seed clients + projets démo (si absents)");

        // ── 1. Clients ────────────────────────────────────────────────────────

        Client clientA = ensureClient(
                DEMO_CLIENT_EMAIL,
                "Client", "Démo",
                "+21600000003",
                "Tunis — adresse de démonstration",
                CLIENT_USER_ID   // peut se connecter côté client
        );

        Client clientB = ensureClient(
                PROSPECT_CLIENT_EMAIL,
                "Sofiane", "Trabelsi",
                "+21699000010",
                "Sfax, Route Menzel Chaker",
                null             // pas de compte client (fiche installateur seulement)
        );

        // ── 2. Projets ────────────────────────────────────────────────────────

        // Projet 1 — scénario installateur, chantier principal
        ensureProject(
                PROJECT_1,
                INSTALLER_USER_ID,
                INSTALLER_EMAIL,
                null,
                null,
                ProjectRequest.builder()
                        .name(PROJECT_1)
                        .description("Projet résidentiel de démonstration — seed Docker")
                        .location("Tunis")
                        .latitude(36.8065)
                        .longitude(10.1815)
                        .peakPower(6.0)
                        .availableArea(40.0)
                        .inclination(25.0)
                        .orientation(180.0)
                        .budget(15_000.0)
                        .clientId(clientA.getId())
                        .build()
        );

        // Projet 2 — scénario installateur, second client (fiche prospect)
        ensureProject(
                PROJECT_2,
                INSTALLER_USER_ID,
                INSTALLER_EMAIL,
                null,
                null,
                ProjectRequest.builder()
                        .name(PROJECT_2)
                        .description("Extension toiture — villa Trabelsi, seed Docker")
                        .location("Sfax")
                        .latitude(34.7406)
                        .longitude(10.7603)
                        .peakPower(4.0)
                        .availableArea(28.0)
                        .inclination(22.0)
                        .orientation(170.0)
                        .budget(10_000.0)
                        .clientId(clientB.getId())
                        .build()
        );

        // Projet 3 — scénario admin : l'admin choisit l'installateur
        //   ↔ équivalent de POST /api/projects/admin/assign {installerId: INSTALLER_USER_ID, ...}
        ensureProject(
                PROJECT_3,
                INSTALLER_USER_ID,
                INSTALLER_EMAIL,
                ADMIN_USER_ID,
                ADMIN_EMAIL,
                ProjectRequest.builder()
                        .name(PROJECT_3)
                        .description("Centrale solaire bâtiment industriel — affectation admin, seed Docker")
                        .location("Tunis")
                        .latitude(36.7500)
                        .longitude(10.2000)
                        .peakPower(10.0)
                        .availableArea(80.0)
                        .inclination(15.0)
                        .orientation(185.0)
                        .budget(30_000.0)
                        .clientId(clientA.getId())
                        .build()
        );

        log.info("Seed terminé — clients: 2, projets: 3");
        log.info("  Installer: {} / SolarEase123!", INSTALLER_EMAIL);
        log.info("  Client:    client.demo@solarease.com    / SolarEase123!");
        log.info("  Admin:     {} / SolarEase123!", ADMIN_EMAIL);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Client ensureClient(String email, String firstName, String lastName,
                                String phone, String address, String userId) {
        return clientRepository.findByEmail(email).orElseGet(() -> {
            Client c = Client.builder()
                    .firstName(firstName)
                    .lastName(lastName)
                    .email(email)
                    .phoneNumber(phone)
                    .address(address)
                    .installerId(INSTALLER_USER_ID)
                    .userId(userId)
                    .build();
            Client saved = clientRepository.save(c);
            log.info("Créé client démo {} id={} userId={}", email, saved.getId(), userId);
            return saved;
        });
    }

        private void ensureProject(String nameKey,
                                                           String installerId,
                                                           String installerEmail,
                                                           String assignedByAdminId,
                                                           String assignedByAdminEmail,
                                                           ProjectRequest request) {
        if (projectRepository.existsByName(nameKey)) {
            log.debug("Projet démo déjà présent: '{}'", nameKey);
            return;
        }
                projectService.createProject(installerId, installerEmail, assignedByAdminId, assignedByAdminEmail, request);
                log.info("Créé projet démo «{}» (installerId={}, assignedByAdminId={})", nameKey, installerId, assignedByAdminId);
    }
}
