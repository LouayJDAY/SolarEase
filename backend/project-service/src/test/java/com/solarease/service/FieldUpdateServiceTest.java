package com.solarease.service;

import com.solarease.dto.FieldUpdateCreateRequest;
import com.solarease.dto.FieldUpdateDTO;
import com.solarease.entity.FieldUpdateEntity;
import com.solarease.entity.Project;
import com.solarease.enums.BlockageImpact;
import com.solarease.enums.BlockageType;
import com.solarease.enums.InstallationPhase;
import com.solarease.enums.InstallerFieldStatus;
import com.solarease.repository.FieldUpdateRepository;
import com.solarease.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FieldUpdateServiceTest {

    @Mock private FieldUpdateRepository fieldUpdateRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private NotificationWebSocketService notificationService;

    @InjectMocks private FieldUpdateService service;

    private Project project;

    @BeforeEach
    void setUp() {
        project = Project.builder()
                .id(1L)
                .name("Villa Sfax")
                .assignedByAdminId("admin-1")
                .build();
    }

    @Test
    void computeProgress_emptyChecklist_fallsBackToManualOverride() {
        assertThat(FieldUpdateService.computeProgress(List.of(), 42)).isEqualTo(42);
        assertThat(FieldUpdateService.computeProgress(null, 17)).isEqualTo(17);
        assertThat(FieldUpdateService.computeProgress(null, null)).isEqualTo(0);
    }

    @Test
    void computeProgress_threeOfSix_returnsFifty() {
        List<String> steps = List.of("PREPARATION", "STRUCTURE", "PV");
        assertThat(FieldUpdateService.computeProgress(steps, null)).isEqualTo(50);
    }

    @Test
    void computeProgress_allSix_returnsHundred() {
        List<String> steps = List.of("PREPARATION", "STRUCTURE", "PV", "ELECTRIQUE", "TESTS", "ADMIN_STEG");
        assertThat(FieldUpdateService.computeProgress(steps, null)).isEqualTo(100);
    }

    @Test
    void lastCompletedPhase_returnsLastInCanonicalOrder() {
        List<String> steps = List.of("STRUCTURE", "PREPARATION");
        assertThat(FieldUpdateService.lastCompletedPhase(steps)).isEqualTo(InstallationPhase.STRUCTURE);
    }

    @Test
    void sanitizeSteps_dropsUnknownAndDuplicates() {
        List<String> steps = List.of("PREPARATION", "PREPARATION", "BOGUS", "PV", "");
        assertThat(FieldUpdateService.sanitizeSteps(steps))
                .containsExactly("PREPARATION", "PV");
    }

    @Test
    void createFieldUpdate_withChecklist_computesProgressAndSetsPhase() {
        FieldUpdateCreateRequest req = new FieldUpdateCreateRequest();
        req.setFieldStatus(InstallerFieldStatus.EN_INSTALLATION);
        req.setCompletedSteps(List.of("PREPARATION", "STRUCTURE", "PV"));

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(fieldUpdateRepository.save(any(FieldUpdateEntity.class)))
                .thenAnswer(inv -> {
                    FieldUpdateEntity e = inv.getArgument(0);
                    e.setId(99L);
                    return e;
                });

        FieldUpdateDTO dto = service.createFieldUpdate(1L, "installer-1", "i@x.tn", req);

        assertThat(dto.getProgressPercent()).isEqualTo(50);
        assertThat(dto.getCurrentPhase()).isEqualTo("PV");
        assertThat(dto.getCurrentPhaseLabel()).isEqualTo("Pose des panneaux");
        assertThat(project.getCurrentProgress()).isEqualTo(50);
        assertThat(project.getCurrentPhase()).isEqualTo(InstallationPhase.PV);

        ArgumentCaptor<FieldUpdateEntity> captor = ArgumentCaptor.forClass(FieldUpdateEntity.class);
        verify(fieldUpdateRepository).save(captor.capture());
        assertThat(captor.getValue().getCompletedSteps())
                .containsExactly("PREPARATION", "STRUCTURE", "PV");
    }

    @Test
    void createFieldUpdate_withBlockageType_setsBlockageAndEnrichesNotification() {
        FieldUpdateCreateRequest req = new FieldUpdateCreateRequest();
        req.setFieldStatus(InstallerFieldStatus.SUR_SITE);
        req.setBlockageType(BlockageType.METEO);
        req.setBlockageImpact(BlockageImpact.THREE_DAYS);
        req.setBlockageReason("Pluie torrentielle");

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(fieldUpdateRepository.save(any(FieldUpdateEntity.class)))
                .thenAnswer(inv -> {
                    FieldUpdateEntity e = inv.getArgument(0);
                    e.setId(7L);
                    return e;
                });

        FieldUpdateDTO dto = service.createFieldUpdate(1L, "installer-1", "i@x.tn", req);

        assertThat(dto.getIsBlockage()).isTrue();
        assertThat(dto.getBlockageType()).isEqualTo("METEO");
        assertThat(dto.getBlockageTypeLabel()).isEqualTo("Météo");
        assertThat(dto.getBlockageImpactLabel()).isEqualTo("+3 jours");

        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationService, atLeastOnce())
                .notifyUser(eq("admin-1"), anyString(), messageCaptor.capture());
        String message = messageCaptor.getValue();
        assertThat(message).contains("BLOCAGE");
        assertThat(message).contains("Météo");
        assertThat(message).contains("+3 jours");
        assertThat(message).contains("Pluie torrentielle");
    }
}
