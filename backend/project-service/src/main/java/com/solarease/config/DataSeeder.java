package com.solarease.config;

import com.solarease.entity.*;
import com.solarease.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Données de démo génériques (notifications, conversations, docs/factures si un projet existe).
 * S'exécute après {@link DemoProjectSeeder} pour peupler docs/factures au premier démarrage Docker.
 */
@Component
@Order(200)
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final NotificationRepository notificationRepository;
    private final ConversationRepository conversationRepository;
    private final DocumentRepository documentRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;

    @Override
    public void run(ApplicationArguments args) {
        seed();
    }

    public void seed() {
        String demoClientKey = DemoProjectSeeder.CLIENT_USER_ID;
        String demoInstallerKey = DemoProjectSeeder.INSTALLER_USER_ID;

        if (notificationRepository.count() == 0) {
            NotificationEntity n1 = new NotificationEntity(null, demoClientKey, "Document ajouté", "Le certificat de conformité a été ajouté à votre espace documents.", false, LocalDateTime.now().minusHours(1));
            NotificationEntity n2 = new NotificationEntity(null, demoClientKey, "Visite technique", "La visite technique s'est bien déroulée. Le rapport est disponible dans vos documents.", true, LocalDateTime.now().minusDays(1));
            notificationRepository.save(n1);
            notificationRepository.save(n2);
        }

        if (conversationRepository.count() == 0) {
            ConversationEntity c = new ConversationEntity();
            c.setClientId(demoClientKey);
            c.setProjectId(null);
            c.getParticipants().add(demoClientKey);
            c.getParticipants().add(demoInstallerKey);
            MessageEntity m1 = new MessageEntity();
            m1.setConversation(c);
            m1.setSenderId(demoInstallerKey);
            m1.setSenderName("Installateur");
            m1.setSenderRole("INSTALLER");
            m1.setContent("Bonjour, votre installation est programmée.");
            m1.setTimestamp(Instant.now().minusSeconds(7200));
            MessageEntity m2 = new MessageEntity();
            m2.setConversation(c);
            m2.setSenderId(demoClientKey);
            m2.setSenderName("Vous");
            m2.setSenderRole("CLIENT");
            m2.setContent("Merci, à quelle date ?");
            m2.setTimestamp(Instant.now().minusSeconds(7100));
            c.getMessages().add(m1);
            c.getMessages().add(m2);
            conversationRepository.save(c);
        }

        Optional<Project> anyProject = projectRepository.findAll().stream().findFirst();

        if (documentRepository.count() == 0 && anyProject.isPresent()) {
            Project project = anyProject.get();
            String clientId = resolveClientDocumentKey(project);
            String installerId = project.getInstallerId() == null ? demoInstallerKey : project.getInstallerId();

            DocumentEntity d1 = DocumentEntity.builder()
                .name("Devis installation résidentielle 5kWc")
                .type(DocumentEntity.DocumentType.DEVIS)
                .description("Devis initial du projet")
                .project(project)
                .clientId(clientId)
                .installerId(installerId)
                .url("/files/1")
                .size("245 KB")
                .date(LocalDate.now().minusDays(20))
                .version(1)
                .createdBy(installerId)
                .notes("Généré automatiquement")
                .build();

            DocumentEntity d2 = DocumentEntity.builder()
                .name("Facture d'acompte")
                .type(DocumentEntity.DocumentType.FACTURE)
                .description("Facture d'acompte")
                .project(project)
                .clientId(clientId)
                .installerId(installerId)
                .url("/files/2")
                .size("180 KB")
                .date(LocalDate.now().minusDays(18))
                .version(1)
                .createdBy(installerId)
                .notes("Généré automatiquement")
                .build();

            DocumentEntity d3 = DocumentEntity.builder()
                .name("Certificat de conformité")
                .type(DocumentEntity.DocumentType.CERTIFICAT)
                .description("Certificat final")
                .project(project)
                .clientId(clientId)
                .installerId(installerId)
                .url("/files/3")
                .size("320 KB")
                .date(LocalDate.now().minusDays(5))
                .version(1)
                .createdBy(installerId)
                .notes("Généré automatiquement")
                .build();

            documentRepository.save(d1);
            documentRepository.save(d2);
            documentRepository.save(d3);
        }

        if (invoiceRepository.count() == 0 && anyProject.isPresent()) {
            Project project = anyProject.get();
            String clientId = resolveClientDocumentKey(project);
            String installerId = project.getInstallerId() == null ? demoInstallerKey : project.getInstallerId();

            InvoiceEntity i1 = InvoiceEntity.builder()
                .number("FAC-2026-001")
                .project(project)
                .clientId(clientId)
                .installerId(installerId)
                .date(LocalDate.now().minusDays(20))
                .dueDate(LocalDate.now().plusDays(10))
                .amount(BigDecimal.valueOf(8000.0))
                .status(InvoiceEntity.InvoiceStatus.PAID)
                .build();

            InvoiceEntity i2 = InvoiceEntity.builder()
                .number("FAC-2026-002")
                .project(project)
                .clientId(clientId)
                .installerId(installerId)
                .date(LocalDate.now().minusDays(12))
                .dueDate(LocalDate.now().plusDays(18))
                .amount(BigDecimal.valueOf(12000.0))
                .status(InvoiceEntity.InvoiceStatus.SENT)
                .build();

            invoiceRepository.save(i1);
            invoiceRepository.save(i2);
        }
    }

    private String resolveClientDocumentKey(Project project) {
        if (project.getClientId() == null) {
            return DemoProjectSeeder.CLIENT_USER_ID;
        }
        return clientRepository.findById(project.getClientId())
                .map(Client::getUserId)
                .filter(id -> id != null && !id.isBlank())
                .orElse(String.valueOf(project.getClientId()));
    }
}
