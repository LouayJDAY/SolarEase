package com.solarease.rag;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.repository.EquipmentRepository;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Locks the deterministic kit selection rules. The values asserted here are
 * the ones documented in the report (Sprint 3) so a regression in the
 * selection logic immediately surfaces in the report's example.
 */
@ExtendWith(MockitoExtension.class)
class EquipmentSelectionServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private EquipmentSelectionService selectionService;

    private List<Equipment> companyInverters;
    private List<Equipment> dcBreakers;
    private List<Equipment> acBreakers;

    @BeforeEach
    void setUp() {
        companyInverters = List.of(
                inverter(101L, "Solax",   "X1-Mini-2.0",  2_000, "MONO"),
                inverter(102L, "Sungrow", "SG3K-S",       3_000, "MONO"),
                inverter(103L, "Sungrow", "SG4K-S",       4_000, "MONO"),
                inverter(104L, "Sungrow", "SG4.5K-S",     4_500, "MONO"),
                inverter(105L, "Sungrow", "SG5K-S",       5_000, "MONO"),
                inverter(106L, "Sungrow", "SG6K-D",       6_000, "TRI"),
                inverter(107L, "Sungrow", "SG6.5K-D",     6_500, "TRI"),
                inverter(108L, "Sungrow", "SG10K-D",     10_000, "TRI"));

        dcBreakers = List.of(
                breaker(201L, EquipmentType.CIRCUIT_BREAKER_DC, "A9N61515", 16, null),
                breaker(202L, EquipmentType.CIRCUIT_BREAKER_DC, "A9N61525", 25, null),
                breaker(203L, EquipmentType.CIRCUIT_BREAKER_DC, "A9N61532", 32, null),
                breaker(204L, EquipmentType.CIRCUIT_BREAKER_DC, "A9N61540", 40, null));

        acBreakers = List.of(
                breaker(301L, EquipmentType.CIRCUIT_BREAKER_AC, "A9F74116", 16, "MONO"),
                breaker(302L, EquipmentType.CIRCUIT_BREAKER_AC, "A9F74125", 25, "MONO"),
                breaker(303L, EquipmentType.CIRCUIT_BREAKER_AC, "A9F74132", 32, "MONO"),
                breaker(304L, EquipmentType.CIRCUIT_BREAKER_AC, "A9F74440", 40, "TRI"),
                breaker(305L, EquipmentType.CIRCUIT_BREAKER_AC, "A9F74450", 50, "TRI"));

        lenient().when(equipmentRepository.findByType(EquipmentType.INVERTER))
                .thenReturn(companyInverters);
        lenient().when(equipmentRepository.findByType(EquipmentType.CIRCUIT_BREAKER_DC))
                .thenReturn(dcBreakers);
        lenient().when(equipmentRepository.findByType(EquipmentType.CIRCUIT_BREAKER_AC))
                .thenReturn(acBreakers);
    }

    @Test
    void selectsSmallestMonoInverterAboveRequiredKw() {
        Optional<Equipment> chosen = selectionService.selectInverter(4.2);

        assertTrue(chosen.isPresent());
        assertEquals("SG4.5K-S", chosen.get().getModel(),
                "4.2 kWc must pick the next mono inverter (4.5 kW)");
    }

    @Test
    void switchesToTriphaseAtFiveAndAHalfKw() {
        Optional<Equipment> chosen = selectionService.selectInverter(6.2);

        assertTrue(chosen.isPresent());
        assertEquals("TRI", chosen.get().getSpecifications().contains("\"phase\":\"TRI\"")
                ? "TRI" : "?",
                "Above 5.5 kWc the engine must pick a tri-phase inverter");
        assertEquals("SG6.5K-D", chosen.get().getModel());
    }

    @Test
    void fallsBackToHighestPowerWhenNothingExceedsRequired() {
        Optional<Equipment> chosen = selectionService.selectInverter(50.0);

        assertTrue(chosen.isPresent());
        assertEquals("SG10K-D", chosen.get().getModel(),
                "Above the catalog max we still propose the largest inverter, "
                        + "the rule engine flags the under-sizing");
    }

    @Test
    void cableSectionsFollowPowerBrackets() {
        assertEquals(4.0,  selectionService.selectDcCable(2.5).getSectionMm2());
        assertEquals(6.0,  selectionService.selectDcCable(5.0).getSectionMm2());
        assertEquals(10.0, selectionService.selectDcCable(8.0).getSectionMm2());

        assertEquals(2.5, selectionService.selectAcCable(2.5).getSectionMm2());
        assertEquals(4.0, selectionService.selectAcCable(5.0).getSectionMm2());
        assertEquals(6.0, selectionService.selectAcCable(8.0).getSectionMm2());
    }

    @Test
    void picksSmallestSchneiderDcBreakerCoveringStringCurrent() {
        Optional<Equipment> dc = selectionService.selectDcBreaker(5.0);

        assertTrue(dc.isPresent());
        assertEquals("A9N61525", dc.get().getModel(),
                "5 kWc string ⇒ Schneider A9N61525 (25 A)");
    }

    @Test
    void picksMonoBreakerForResidentialAndTriForCommercial() {
        Optional<Equipment> ac5kw = selectionService.selectAcBreaker(5.0, "MONO");
        Optional<Equipment> ac10kw = selectionService.selectAcBreaker(10.0, "TRI");

        assertTrue(ac5kw.isPresent());
        assertEquals("A9F74132", ac5kw.get().getModel(),
                "5 kW mono ⇒ ~21.7 A x 1.25 = 27 A ⇒ Schneider 32 A 1P");

        assertTrue(ac10kw.isPresent());
        assertEquals("A9F74440", ac10kw.get().getModel(),
                "10 kW tri ⇒ ~14.4 A x 1.25 = 18 A ⇒ Schneider 40 A 4P (smallest tri available)");
    }

    @Test
    void alternativesExcludeCurrentInverterAndStaySamePhase() {
        Equipment used = companyInverters.stream()
                .filter(e -> "SG5K-S".equals(e.getModel())).findFirst().orElseThrow();

        List<Equipment> alts = selectionService.selectAlternatives(used, 5.0, 2);

        assertNotNull(alts);
        assertEquals(2, alts.size());
        assertTrue(alts.stream().noneMatch(e -> e.getId().equals(used.getId())));
        assertTrue(alts.stream().allMatch(e ->
                e.getSpecifications().contains("\"phase\":\"MONO\"")),
                "Alternatives keep the same phase as the chosen inverter");
    }

    @Test
    void totalKitPriceSumsInverterAndBreakers() {
        Equipment inverter = companyInverters.get(4);    // SG5K-S
        Equipment dc = dcBreakers.get(1);                 // A9N61525
        Equipment ac = acBreakers.get(1);                 // A9F74125

        BigDecimal expected = inverter.getPrice()
                .add(dc.getPrice())
                .add(ac.getPrice());

        assertEquals(expected, selectionService.totalKitPrice(inverter, dc, ac));
    }

    // ── helpers ────────────────────────────────────────────────────────

    private Equipment inverter(long id, String brand, String model, int powerW, String phase) {
        return Equipment.builder()
                .id(id)
                .brand(brand)
                .model(model)
                .type(EquipmentType.INVERTER)
                .nominalPower((double) powerW)
                .price(BigDecimal.valueOf(800 + powerW * 0.4))
                .specifications(String.format(
                        "{\"phase\":\"%s\",\"minPowerKw\":%.1f,\"maxPowerKw\":%.1f}",
                        phase, powerW / 1000.0 - 0.5, powerW / 1000.0 + 0.3))
                .build();
    }

    private Equipment breaker(long id, EquipmentType type, String ref, int ratingA,
                              String phase) {
        StringBuilder spec = new StringBuilder();
        spec.append("{\"ratingA\":").append(ratingA);
        if (phase != null) spec.append(",\"phase\":\"").append(phase).append('"');
        spec.append(",\"schneiderRef\":\"").append(ref).append("\"}");
        return Equipment.builder()
                .id(id)
                .brand("Schneider Electric")
                .model(ref)
                .type(type)
                .price(BigDecimal.valueOf(ratingA * 1.5 + 40))
                .specifications(spec.toString())
                .build();
    }
}
