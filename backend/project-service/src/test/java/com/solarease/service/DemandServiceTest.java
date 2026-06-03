package com.solarease.service;

import com.solarease.dto.DemandCreateRequest;
import com.solarease.dto.DemandDTO;
import com.solarease.dto.ProjectRequest;
import com.solarease.dto.ProjectResponse;
import com.solarease.dto.PublicDemandCreateRequest;
import com.solarease.entity.Client;
import com.solarease.entity.DemandEntity;
import com.solarease.enums.DemandPriority;
import com.solarease.enums.DemandSource;
import com.solarease.enums.DemandStatus;
import com.solarease.exception.ResourceNotFoundException;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.DemandRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the DemandService.
 *
 * <p>Covers the full lifecycle: create (public + client), status changes,
 * priority/assignment updates, convert-to-project and the promote-public flow.
 * The notification broadcaster is mocked -- we only assert that the right
 * callbacks are invoked.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DemandServiceTest {

    @Mock private DemandRepository demandRepository;
    @Mock private ProjectService projectService;
    @Mock private ClientRepository clientRepository;
    @Mock private NotificationWebSocketService notificationService;
    @Mock private InvitationService invitationService;

    @InjectMocks private DemandService demandService;

    private DemandEntity sample;

    @BeforeEach
    void setUp() {
        when(invitationService.latestInvitationSentAt(any())).thenReturn(java.util.Optional.empty());
        sample = DemandEntity.builder()
                .id(42L)
                .clientUserId("user-uuid")
                .clientEmail("client@example.com")
                .clientFirstName("Ali")
                .clientLastName("Ben Salah")
                .clientPhone("+216 22 333 444")
                .status(DemandStatus.NOUVELLE)
                .source(DemandSource.CLIENT)
                .priority(DemandPriority.NORMALE)
                .name("Installation solaire")
                .description("Une maison de 120 m2")
                .latitude(36.8)
                .longitude(10.1)
                .peakPower(6.0)
                .build();
    }

    // ── createDemand ─────────────────────────────────────────────────────────

    @Test
    void createDemand_persistsAndBroadcasts() {
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> {
            DemandEntity in = inv.getArgument(0);
            in.setId(42L);
            return in;
        });

        DemandCreateRequest req = new DemandCreateRequest();
        req.setName("Installation solaire");
        req.setDescription("Une maison");

        DemandDTO dto = demandService.createDemand("user-uuid", "c@x.tn", "Ali", "Ben", req);

        assertNotNull(dto);
        assertEquals(DemandSource.CLIENT, dto.getSource(), "client portal demands must be tagged CLIENT");
        assertEquals(DemandStatus.NOUVELLE, dto.getStatus());
        assertEquals(DemandPriority.NORMALE, dto.getPriority());

        ArgumentCaptor<DemandEntity> captor = ArgumentCaptor.forClass(DemandEntity.class);
        verify(demandRepository).save(captor.capture());
        assertEquals("user-uuid", captor.getValue().getClientUserId());

        verify(notificationService).notifyAdminsOnNewDemand(any(DemandDTO.class));
    }

    // ── createPublicDemand ───────────────────────────────────────────────────

    @Test
    void createPublicDemand_marksSourceAsPublicAndBuildsPseudoId() {
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        PublicDemandCreateRequest req = new PublicDemandCreateRequest();
        req.setFullName("Wassim Dhaouadi");
        req.setEmail("Wassim@TEST.com");
        req.setPhone("+216 55 12 34 56");
        req.setSubject("devis");
        req.setMessage("Je voudrais un devis pour 5 kWc.");

        DemandDTO dto = demandService.createPublicDemand(req);

        assertEquals(DemandSource.PUBLIC, dto.getSource(), "public form demands must be tagged PUBLIC");
        assertTrue(dto.getClientUserId().startsWith("PUBLIC:"),
                "public demand must carry a 'PUBLIC:' pseudo-id");
        assertEquals("wassim@test.com", dto.getClientEmail(), "email must be normalised to lower-case");
        assertEquals("Wassim", dto.getClientFirstName());
        assertEquals("Dhaouadi", dto.getClientLastName());
        assertTrue(dto.getDescription().contains("Téléphone:"),
                "phone must be appended to the description for the admin reader");

        verify(notificationService).notifyAdminsOnNewDemand(any(DemandDTO.class));
    }

    @Test
    void createPublicDemand_acceptsLongSimulatorMessage() {
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        String longMessage = """
                Bonjour,
                Je souhaite un devis personnalisé basé sur ma simulation SolarEase.

                Type de bien: Maison
                Facture trimestrielle: 451 TND
                Surface toiture: 50 m²
                Région: Tunis
                Puissance estimée: 4.5 kWc
                Investissement estimé: 12000 TND
                Économies annuelles estimées: 1800 TND

                Merci de me recontacter pour une étude précise.""";

        PublicDemandCreateRequest req = new PublicDemandCreateRequest();
        req.setFullName("Test User");
        req.setEmail("long-msg@example.com");
        req.setPhone("+216 55 12 34 56");
        req.setSubject("devis");
        req.setMessage(longMessage);

        DemandDTO dto = demandService.createPublicDemand(req);

        assertTrue(dto.getDescription().length() > 255,
                "simulator payload must survive without truncation at service layer");
        assertTrue(dto.getDescription().contains("simulation SolarEase"));
    }

    // ── updateStatus ─────────────────────────────────────────────────────────

    @Test
    void updateStatus_changesStatusAndPushesClientNotification() {
        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        DemandDTO dto = demandService.updateStatus(42L, DemandStatus.A_COMPLETER, "Précisez la surface", null);

        assertEquals(DemandStatus.A_COMPLETER, dto.getStatus());
        assertEquals("Précisez la surface", dto.getAdminNote());
        verify(notificationService).notifyDemandStatusChange(any(DemandDTO.class));
    }

    @Test
    void updateStatus_skipsNotificationWhenStatusUnchanged() {
        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        demandService.updateStatus(42L, DemandStatus.NOUVELLE, null, null);

        verify(notificationService, never()).notifyDemandStatusChange(any(DemandDTO.class));
    }

    @Test
    void updateStatus_throwsWhenDemandNotFound() {
        when(demandRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> demandService.updateStatus(99L, DemandStatus.VALIDEE, null, null));

        verify(notificationService, never()).notifyDemandStatusChange(any(DemandDTO.class));
    }

    // ── assignDemand & priority ──────────────────────────────────────────────

    @Test
    void assignDemand_setsAssignedAdminId() {
        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        DemandDTO dto = demandService.assignDemand(42L, "admin-uuid");

        assertEquals("admin-uuid", dto.getAssignedAdminId());
    }

    @Test
    void assignDemand_blankIdUnassigns() {
        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        DemandDTO dto = demandService.assignDemand(42L, "   ");

        assertNull(dto.getAssignedAdminId());
    }

    @Test
    void updatePriority_setsPriority() {
        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        DemandDTO dto = demandService.updatePriority(42L, DemandPriority.HAUTE);

        assertEquals(DemandPriority.HAUTE, dto.getPriority());
    }

    // ── convertToProject ─────────────────────────────────────────────────────

    @Test
    void convertToProject_marksDemandValideeAndNotifies() {
        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        ProjectResponse newProject = ProjectResponse.builder().id(100L).build();
        when(projectService.createProject(anyString(), anyString(), anyString(), anyString(), any(ProjectRequest.class)))
                .thenReturn(newProject);

        ProjectResponse result = demandService.convertToProject(42L, 7L, "admin-uuid", "admin@x.tn", null, null);

        assertEquals(100L, result.getId());
        assertEquals(DemandStatus.VALIDEE, sample.getStatus(), "demand status flips to VALIDEE");
        assertEquals(100L, sample.getProjectId(),               "demand carries the new project id");
        verify(notificationService).notifyDemandStatusChange(any(DemandDTO.class));
    }

    @Test
    void convertToProject_failsIfAlreadyConverted() {
        sample.setProjectId(99L);
        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));

        assertThrows(IllegalStateException.class,
                () -> demandService.convertToProject(42L, 7L, "admin", "a@a.tn", null, null));

        verify(projectService, never()).createProject(anyString(), anyString(), anyString(), anyString(), any(ProjectRequest.class));
    }

    // ── promotePublicAndConvert ──────────────────────────────────────────────

    @Test
    void promotePublicAndConvert_createsClientThenProject() {
        sample.setSource(DemandSource.PUBLIC);
        sample.setClientUserId("PUBLIC:public@x.tn");
        sample.setClientEmail("public@x.tn");

        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));
        when(clientRepository.findByEmail("public@x.tn")).thenReturn(Optional.empty());
        Client created = Client.builder().id(55L).email("public@x.tn").firstName("Ali").lastName("Ben Salah").build();
        when(clientRepository.save(any(Client.class))).thenReturn(created);
        when(clientRepository.findById(55L)).thenReturn(Optional.of(created));
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        ProjectResponse newProject = ProjectResponse.builder().id(200L).build();
        when(projectService.createProject(anyString(), anyString(), anyString(), anyString(), any(ProjectRequest.class)))
                .thenReturn(newProject);

        ProjectResponse result = demandService.promotePublicAndConvert(42L, "admin-uuid", "admin@x.tn", 36.8, 10.1);

        assertEquals(200L, result.getId());
        verify(clientRepository).save(any(Client.class));
        ArgumentCaptor<ProjectRequest> reqCaptor = ArgumentCaptor.forClass(ProjectRequest.class);
        verify(projectService).createProject(anyString(), anyString(), anyString(), anyString(), reqCaptor.capture());
        assertEquals(55L, reqCaptor.getValue().getClientId());
    }

    @Test
    void promotePublicAndConvert_reusesExistingClientByEmail() {
        sample.setSource(DemandSource.PUBLIC);
        sample.setClientEmail("known@x.tn");

        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));
        Client existing = Client.builder().id(7L).email("known@x.tn").build();
        when(clientRepository.findByEmail("known@x.tn")).thenReturn(Optional.of(existing));
        when(clientRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(demandRepository.save(any(DemandEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        ProjectResponse newProject = ProjectResponse.builder().id(201L).build();
        when(projectService.createProject(anyString(), anyString(), anyString(), anyString(), any(ProjectRequest.class)))
                .thenReturn(newProject);

        demandService.promotePublicAndConvert(42L, "admin", "a@a.tn", null, null);

        verify(clientRepository, never()).save(any(Client.class));
    }

    @Test
    void promotePublicAndConvert_failsWhenEmailMissing() {
        sample.setSource(DemandSource.PUBLIC);
        sample.setClientEmail(null);
        when(demandRepository.findById(42L)).thenReturn(Optional.of(sample));

        assertThrows(IllegalStateException.class,
                () -> demandService.promotePublicAndConvert(42L, "admin", "a@a.tn", null, null));
    }
}
