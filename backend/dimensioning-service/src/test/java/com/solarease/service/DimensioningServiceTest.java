package com.solarease.service;

import com.solarease.client.PvgisClient;
import com.solarease.dto.DimensioningRequest;
import com.solarease.dto.DimensioningResponse;
import com.solarease.dto.FinancialMetrics;
import com.solarease.entity.Dimensioning;
import com.solarease.entity.Equipment;
import com.solarease.entity.RoofCharacteristic;
import com.solarease.entity.SolarInstallation;
import com.solarease.enums.DimensioningStatus;
import com.solarease.enums.EquipmentType;
import com.solarease.enums.Orientation;
import com.solarease.enums.RoofType;
import com.solarease.rag.InstallerRecommendationDto;
import com.solarease.repository.DimensioningRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DimensioningServiceTest {

    @Mock
    private DimensioningRepository dimensioningRepository;
    @Mock
    private PvgisClient pvgisClient;
    @Mock
    private EquipmentService equipmentService;
    @Mock
    private DecisionSupportService decisionSupportService;
    @Mock
    private FinancialService financialService;
    @Mock
    private PdfGenerationService pdfGenerationService;

    @InjectMocks
    private DimensioningService dimensioningService;

    private DimensioningRequest request;
    private Equipment panel;
    private Equipment inverter;

    @BeforeEach
    void setUp() {
        request = new DimensioningRequest();
        request.setProjectId(1L);
        request.setArea(50.0);
        request.setInclination(30.0);
        request.setOrientation(Orientation.SOUTH);
        request.setRoofType(RoofType.FLAT);
        request.setLatitude(36.8);
        request.setLongitude(10.18);

        panel = Equipment.builder()
                .id(1L)
                .name("Solareo Mono-400")
                .type(EquipmentType.SOLAR_PANEL)
                .brand("Solareo")
                .model("Mono-400")
                .nominalPower(400.0)
                .area(1.9)
                .price(BigDecimal.valueOf(800))
                .build();
        inverter = Equipment.builder()
                .id(2L)
                .name("Sungrow SG5K-S")
                .type(EquipmentType.INVERTER)
                .brand("Sungrow")
                .model("SG5K-S")
                .nominalPower(5000.0)
                .price(BigDecimal.valueOf(2500))
                .specifications("{\"phase\":\"MONO\"}")
                .build();

        // Common stubs (lenient because not every test path uses every collaborator).
        lenient().when(equipmentService.getEquipmentByType(EquipmentType.SOLAR_PANEL))
                .thenReturn(List.of(panel));
        lenient().when(equipmentService.getEquipmentByType(EquipmentType.INVERTER))
                .thenReturn(List.of(inverter));
        lenient().when(equipmentService.getEquipmentByType(EquipmentType.NIGHT_PANEL))
                .thenReturn(Collections.emptyList());

        lenient().when(financialService.calculateMetrics(any(SolarInstallation.class)))
                .thenAnswer(inv -> FinancialMetrics.builder()
                        .totalInvestmentCost(0.0)
                        .annualSavings(0.0)
                        .roiPercentage(0.0)
                        .paybackPeriodYears(0.0)
                        .netSavings25Years(0.0)
                        .build());

        lenient().when(decisionSupportService.generate(any(), any(), any()))
                .thenReturn(new DecisionSupportService.Result(
                        InstallerRecommendationDto.builder()
                                .verdict("OK")
                                .compatibilityScore(90)
                                .build(),
                        "Recommandation générée."));
    }

    @Test
    void calculate_ShouldReturnValidResponse_WhenInputIsCorrect() {
        when(dimensioningRepository.save(any(Dimensioning.class))).thenAnswer(invocation -> {
            Dimensioning d = invocation.getArgument(0);
            d.setId(1L);
            d.setCreatedAt(LocalDateTime.now());
            return d;
        });

        DimensioningResponse response = dimensioningService.calculateDimensioning(request);

        assertNotNull(response);
        assertNotNull(response.getInstallation());
        assertTrue(response.getInstallation().getPanelCount() > 0);
        assertTrue(response.getInstallation().getTotalCapacityKw() > 0);
        verify(dimensioningRepository, times(1)).save(any(Dimensioning.class));
    }

    @Test
    void calculate_ShouldAccountForOrientationEfficiency() {
        DimensioningRequest southRequest = cloneRequest(Orientation.SOUTH);
        DimensioningRequest northRequest = cloneRequest(Orientation.NORTH);

        when(dimensioningRepository.save(any(Dimensioning.class))).thenAnswer(i -> {
            Dimensioning d = i.getArgument(0);
            d.setId(100L);
            return d;
        });

        DimensioningResponse southResponse = dimensioningService.calculateDimensioning(southRequest);
        DimensioningResponse northResponse = dimensioningService.calculateDimensioning(northRequest);

        assertNotNull(southResponse.getInstallation());
        assertNotNull(northResponse.getInstallation());
        assertTrue(southResponse.getInstallation().getEstimatedAnnualProductionKwh()
                        > northResponse.getInstallation().getEstimatedAnnualProductionKwh(),
                "South facing should have higher production");
    }

    @Test
    void getDimensioningByProject_ShouldReturnResult_WhenExists() {
        Dimensioning dimensioning = new Dimensioning();
        dimensioning.setId(1L);
        dimensioning.setProjectId(1L);
        dimensioning.setStatus(DimensioningStatus.COMPLETED);
        dimensioning.setSolarInstallation(SolarInstallation.builder().build());

        when(dimensioningRepository.findByProjectId(1L))
                .thenReturn(Collections.singletonList(dimensioning));

        List<DimensioningResponse> result = dimensioningService.getDimensioningByProjectId(1L);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1L, result.get(0).getProjectId());
    }

    @Test
    void getDimensioningById_ShouldThrowException_WhenNotFound() {
        when(dimensioningRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> dimensioningService.getDimensioningById(99L));
    }

    private DimensioningRequest cloneRequest(Orientation orientation) {
        DimensioningRequest r = new DimensioningRequest();
        r.setProjectId(orientation == Orientation.SOUTH ? 1L : 2L);
        r.setArea(50.0);
        r.setInclination(30.0);
        r.setOrientation(orientation);
        r.setRoofType(RoofType.FLAT);
        r.setLatitude(36.8);
        r.setLongitude(10.18);
        return r;
    }
}
