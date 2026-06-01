package com.solarease.rag;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Locks the deterministic compatibility scoring used by the RAG pipeline.
 *
 * Because the score is purely deterministic (no LLM, no randomness) we can
 * assert exact values: this protects the report's documented example
 * (5 kWc + Sungrow 5K mono => verdict OK, score >= 85).
 */
class CompatibilityRuleEngineTest {

    private final CompatibilityRuleEngine engine = new CompatibilityRuleEngine();

    @Test
    void perfectMonoMatch_returnsOkVerdict() {
        Equipment inverter = mono(5_000);
        Equipment dcBreaker = breaker(EquipmentType.CIRCUIT_BREAKER_DC, 25);
        Equipment acBreaker = breaker(EquipmentType.CIRCUIT_BREAKER_AC, 25);

        CompatibilityRuleEngine.Result result = engine.evaluate(
                5.0, inverter, cable(6.0), dcBreaker, acBreaker);

        assertEquals("OK", result.verdict());
        assertTrue(result.score() >= 85, "Expected >= 85, got " + result.score());
        assertTrue(result.alerts().isEmpty(),
                "Perfect match should produce no alert");
    }

    @Test
    void underSizedInverter_triggersAttentionVerdict() {
        // 7 kWc requested but a 5 kW MONO inverter is in stock => ratio ~ 0.71.
        Equipment inverter = mono(5_000);

        CompatibilityRuleEngine.Result result = engine.evaluate(
                7.0, inverter, cable(10.0), null, null);

        assertEquals("NON_COMPATIBLE", result.verdict(),
                "Severe under-sizing combined with missing breakers must fail the kit");
        assertFalse(result.alerts().isEmpty());
        assertTrue(result.alerts().stream()
                .anyMatch(a -> a.toLowerCase().contains("écrêtage")
                        || a.toLowerCase().contains("sous-dimensionné")),
                "An under-sizing alert is expected");
    }

    @Test
    void wrongPhaseForLargeInstallation_isFlagged() {
        // 7 kWc must be tri-phase (STEG rule), here we feed a mono inverter.
        Equipment monoInverter = mono(7_000);

        CompatibilityRuleEngine.Result result = engine.evaluate(
                7.0, monoInverter, cable(10.0),
                breaker(EquipmentType.CIRCUIT_BREAKER_DC, 32),
                breaker(EquipmentType.CIRCUIT_BREAKER_AC, 40));

        assertNotNull(result);
        assertTrue(result.alerts().stream()
                .anyMatch(a -> a.toLowerCase().contains("triphasé")
                        || a.toLowerCase().contains("steg")),
                "Phase mismatch must produce a STEG-compliance alert");
    }

    @Test
    void undersizedDcCable_isFlagged() {
        Equipment inverter = mono(5_000);

        CompatibilityRuleEngine.Result result = engine.evaluate(
                5.0, inverter, cable(2.5),
                breaker(EquipmentType.CIRCUIT_BREAKER_DC, 25),
                breaker(EquipmentType.CIRCUIT_BREAKER_AC, 25));

        assertTrue(result.alerts().stream()
                .anyMatch(a -> a.toLowerCase().contains("section dc")),
                "Cable too thin must produce an alert");
        assertTrue(result.score() < 100,
                "Cable penalty must reduce the score below the perfect kit (100)");
    }

    @Test
    void missingBreakers_dropTheScore() {
        Equipment inverter = mono(5_000);

        CompatibilityRuleEngine.Result withBreakers = engine.evaluate(
                5.0, inverter, cable(6.0),
                breaker(EquipmentType.CIRCUIT_BREAKER_DC, 25),
                breaker(EquipmentType.CIRCUIT_BREAKER_AC, 25));

        CompatibilityRuleEngine.Result withoutBreakers = engine.evaluate(
                5.0, inverter, cable(6.0), null, null);

        assertTrue(withoutBreakers.score() < withBreakers.score(),
                "Missing breakers must lower the score");
    }

    // ───────────────────────────────────────────────────────────────────

    private Equipment mono(int powerW) {
        return Equipment.builder()
                .id(1L)
                .type(EquipmentType.INVERTER)
                .brand("Sungrow")
                .model("SG" + (powerW / 1000) + "K-S")
                .nominalPower((double) powerW)
                .price(BigDecimal.valueOf(2500))
                .specifications("{\"phase\":\"MONO\"}")
                .build();
    }

    private Equipment breaker(EquipmentType type, int ratingA) {
        return Equipment.builder()
                .id((long) ratingA)
                .type(type)
                .brand("Schneider Electric")
                .model("ref-" + ratingA)
                .price(BigDecimal.valueOf(80))
                .specifications("{\"ratingA\":" + ratingA + "}")
                .build();
    }

    private InstallerRecommendationDto.KitCable cable(double sectionMm2) {
        return InstallerRecommendationDto.KitCable.builder()
                .sectionMm2(sectionMm2)
                .brand("Câble photovoltaïque tunisien")
                .standard("NFC 33-209")
                .build();
    }
}
