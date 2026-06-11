package com.solarease.service;

import com.solarease.dto.DimensioningResponse;
import com.solarease.dto.FinancialMetrics;
import com.solarease.entity.Equipment;
import com.solarease.entity.SolarInstallation;
import com.solarease.enums.EquipmentType;
import com.solarease.enums.PanelCategory;
import com.solarease.rag.CompatibilityRuleEngine;
import com.solarease.rag.EmbeddingService;
import com.solarease.rag.EquipmentSelectionService;
import com.solarease.rag.InstallerRecommendationDto;
import com.solarease.rag.KnowledgeChunk;
import com.solarease.rag.KnowledgeChunkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Tests for the new hybrid RAG pipeline. The deterministic kit is checked
 * separately from the LLM-augmented narrative so we can guarantee the kit is
 * always returned, even when Ollama is offline.
 */
@ExtendWith(MockitoExtension.class)
class DecisionSupportServiceTest {

    @Mock
    private OllamaService ollamaService;

    @Mock
    private EmbeddingService embeddingService;

    @Mock
    private KnowledgeChunkRepository chunkRepository;

    @Mock
    private EquipmentSelectionService selectionService;

    @Mock
    private CompatibilityRuleEngine ruleEngine;

    @InjectMocks
    private DecisionSupportService decisionSupportService;

    private DimensioningResponse dimensioning;
    private Equipment usedPanel;
    private Equipment usedInverter;

    @BeforeEach
    void setUp() {
        SolarInstallation installation = SolarInstallation.builder()
                .totalCapacityKw(5.0)
                .estimatedAnnualProductionKwh(8000.0)
                .monthlySavings(200.0)
                .panelCount(10)
                .isNightPanel(false)
                .build();

        dimensioning = DimensioningResponse.builder()
                .installation(installation)
                .panelType("CLASSIC")
                .financials(FinancialMetrics.builder()
                        .totalInvestmentCost(15000.0)
                        .roiPercentage(160.0)
                        .paybackPeriodYears(4.5)
                        .annualSavings(2400.0)
                        .netSavings25Years(45000.0)
                        .build())
                .build();

        usedPanel = Equipment.builder()
                .id(1L)
                .brand("JA Solar")
                .model("JAM72S30-540")
                .type(EquipmentType.SOLAR_PANEL)
                .panelCategory(PanelCategory.TOPCON_N_TYPE)
                .nominalPower(540.0)
                .price(BigDecimal.valueOf(1399))
                .build();

        usedInverter = Equipment.builder()
                .id(2L)
                .brand("Sungrow")
                .model("SG5K-S")
                .type(EquipmentType.INVERTER)
                .nominalPower(5000.0)
                .price(BigDecimal.valueOf(2800))
                .specifications("{\"phase\":\"MONO\",\"minPowerKw\":4.5,\"maxPowerKw\":5.3}")
                .build();
    }

    @Test
    void deterministicKit_isAlwaysProduced_evenWhenOllamaIsDown() {
        givenSelectionPicksUsedInverter();
        givenRuleEngineReturnsScore(85, "OK");
        when(embeddingService.embed(anyString()))
                .thenThrow(new EmbeddingService.EmbeddingException("ollama down"));

        DecisionSupportService.Result result =
                decisionSupportService.generate(dimensioning, usedPanel, usedInverter);
        InstallerRecommendationDto rec = result.recommendation();

        assertNotNull(rec);
        assertEquals("OK", rec.getVerdict());
        assertEquals(85, rec.getCompatibilityScore());
        assertNotNull(rec.getRecommendedKit());
        assertNotNull(rec.getRecommendedKit().getInverter());
        assertEquals("Sungrow", rec.getRecommendedKit().getInverter().getBrand());
        assertTrue(rec.isFallback(), "Fallback flag must be set when LLM is unreachable");
        assertNotNull(rec.getNarrativeSummary());
        assertFalse(rec.getClientArguments().isEmpty(),
                "Default sales arguments should be filled in when LLM is unavailable");
    }

    @Test
    void llmAugmentation_parsesAlertsArgumentsAndChecklist() {
        givenSelectionPicksUsedInverter();
        givenRuleEngineReturnsScore(92, "OK");
        when(embeddingService.embed(anyString())).thenReturn(new float[]{0.1f, 0.2f});
        when(chunkRepository.search(any(), anyInt(), any())).thenReturn(List.of(
                KnowledgeChunk.builder()
                        .id(7L)
                        .sourceType("EQUIPMENT")
                        .content("Onduleur Sungrow 5 kW MONO")
                        .build(),
                KnowledgeChunk.builder()
                        .id(8L)
                        .sourceType("SIZING_RULE")
                        .content("Câble DC 6 mm² entre 3 et 6 kWc")
                        .build()));
        when(ollamaService.generate(anyString())).thenReturn(""
                + "RESUME: Kit cohérent pour 5 kWc résidentiel.\n"
                + "ALERTES:\n- Vérifier la marge été\n- Parafoudre type 2 obligatoire\n"
                + "ARGUMENTS_CLIENT:\n- Économies ~200 TND/mois\n"
                + "- ROI 4,5 ans\n"
                + "- Subvention ANME éligible\n"
                + "CHECKLIST_TERRAIN:\n- Section DC 6 mm²\n- Disjoncteur DC en amont\n");

        InstallerRecommendationDto rec = decisionSupportService.generate(
                dimensioning, usedPanel, usedInverter).recommendation();

        assertEquals("Kit cohérent pour 5 kWc résidentiel.", rec.getNarrativeSummary());
        assertTrue(rec.getAlerts().contains("Vérifier la marge été"));
        assertTrue(rec.getClientArguments().contains("ROI 4,5 ans"));
        assertTrue(rec.getTerrainChecklist().contains("Disjoncteur DC en amont"));
        assertEquals(2, rec.getRagSources().size());
        assertFalse(rec.isFallback());
    }

    @Test
    void emptyInstallation_returnsImmediateFallback() {
        DimensioningResponse empty = DimensioningResponse.builder().build();

        DecisionSupportService.Result result =
                decisionSupportService.generate(empty, null, null);

        assertEquals("NON_COMPATIBLE", result.recommendation().getVerdict());
        assertTrue(result.recommendation().isFallback());
        assertEquals("Aucune installation calculée.", result.narrativeSummary());
    }

    // ───────────────────────────────────────────────────────────────────
    // Helpers
    // ───────────────────────────────────────────────────────────────────

    private void givenSelectionPicksUsedInverter() {
        when(selectionService.selectInverter(eq(5.0))).thenReturn(Optional.of(usedInverter));
        when(selectionService.selectAlternatives(any(), eq(5.0), anyInt()))
                .thenReturn(List.of());
        when(selectionService.selectDcCable(eq(5.0))).thenReturn(
                InstallerRecommendationDto.KitCable.builder()
                        .sectionMm2(6.0)
                        .brand("Câble photovoltaïque tunisien")
                        .standard("NFC 33-209")
                        .build());
        when(selectionService.selectAcCable(eq(5.0))).thenReturn(
                InstallerRecommendationDto.KitCable.builder()
                        .sectionMm2(4.0)
                        .brand("Câble photovoltaïque tunisien")
                        .standard("U-1000 R2V")
                        .build());
        Equipment dcBreaker = Equipment.builder()
                .id(10L)
                .brand("Schneider Electric")
                .model("A9N61525")
                .type(EquipmentType.CIRCUIT_BREAKER_DC)
                .price(BigDecimal.valueOf(80))
                .specifications("{\"ratingA\":25,\"schneiderRef\":\"A9N61525\"}")
                .build();
        Equipment acBreaker = Equipment.builder()
                .id(11L)
                .brand("Schneider Electric")
                .model("A9F74125")
                .type(EquipmentType.CIRCUIT_BREAKER_AC)
                .price(BigDecimal.valueOf(70))
                .specifications("{\"ratingA\":25,\"phase\":\"MONO\","
                        + "\"schneiderRef\":\"A9F74125\"}")
                .build();
        when(selectionService.selectDcBreaker(eq(5.0))).thenReturn(Optional.of(dcBreaker));
        lenient().when(selectionService.selectAcBreaker(eq(5.0), anyString()))
                .thenReturn(Optional.of(acBreaker));
        when(selectionService.totalKitPrice(any(), any(), any()))
                .thenReturn(BigDecimal.valueOf(2950));
    }

    private void givenRuleEngineReturnsScore(int score, String verdict) {
        when(ruleEngine.evaluate(anyDouble(), any(), any(), any(), any()))
                .thenReturn(new CompatibilityRuleEngine.Result(score, verdict, List.of()));
    }

    private static double anyDouble() {
        return org.mockito.ArgumentMatchers.anyDouble();
    }
}
