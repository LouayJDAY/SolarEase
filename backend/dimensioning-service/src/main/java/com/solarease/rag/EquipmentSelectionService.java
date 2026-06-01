package com.solarease.rag;

import com.solarease.entity.Equipment;
import com.solarease.enums.EquipmentType;
import com.solarease.repository.EquipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Deterministic kit selection: given a target power in kWc, pick the right
 * inverter, cable section and Schneider breakers from the company catalog.
 *
 * <p>This logic is intentionally <em>not</em> delegated to the LLM. The LLM
 * adds narrative, alerts and sales arguments on top of the kit produced here.
 * That separation guarantees the technical numbers are reproducible and
 * auditable.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EquipmentSelectionService {

    private static final String CABLE_BRAND = "Câble photovoltaïque tunisien";
    private static final String CABLE_STANDARD_DC = "NFC 33-209";
    private static final String CABLE_STANDARD_AC = "U-1000 R2V";

    private final EquipmentRepository equipmentRepository;

    /**
     * Picks the inverter from the catalog whose power rating is the smallest
     * value still &ge; {@code requiredKw}, with phase compatibility. Returns
     * the highest-power inverter when nothing exceeds the requirement, so the
     * frontend can flag the under-sizing through {@link CompatibilityRuleEngine}.
     */
    public Optional<Equipment> selectInverter(double requiredKw) {
        String preferredPhase = requiredKw >= 5.5 ? "TRI" : "MONO";
        List<Equipment> inverters = equipmentRepository.findByType(EquipmentType.INVERTER)
                .stream()
                .filter(e -> matchesPhase(e, preferredPhase))
                .sorted(Comparator.comparingDouble(this::powerKw))
                .toList();
        if (inverters.isEmpty()) {
            return Optional.empty();
        }
        return inverters.stream()
                .filter(e -> powerKw(e) + 0.0001 >= requiredKw)
                .findFirst()
                .or(() -> Optional.of(inverters.get(inverters.size() - 1)));
    }

    /**
     * Returns up to {@code limit} alternative inverters in the same phase,
     * excluding the one currently chosen.
     */
    public List<Equipment> selectAlternatives(Equipment chosen, double requiredKw, int limit) {
        if (chosen == null) {
            return List.of();
        }
        String preferredPhase = readPhase(chosen);
        return equipmentRepository.findByType(EquipmentType.INVERTER).stream()
                .filter(e -> !e.getId().equals(chosen.getId()))
                .filter(e -> matchesPhase(e, preferredPhase))
                .sorted(Comparator.comparingDouble(
                        e -> Math.abs(powerKw(e) - requiredKw)))
                .limit(limit)
                .toList();
    }

    public InstallerRecommendationDto.KitCable selectDcCable(double powerKw) {
        return InstallerRecommendationDto.KitCable.builder()
                .sectionMm2(dcSection(powerKw))
                .brand(CABLE_BRAND)
                .standard(CABLE_STANDARD_DC)
                .application("DC string panneaux → onduleur")
                .build();
    }

    public InstallerRecommendationDto.KitCable selectAcCable(double powerKw) {
        return InstallerRecommendationDto.KitCable.builder()
                .sectionMm2(acSection(powerKw))
                .brand(CABLE_BRAND)
                .standard(CABLE_STANDARD_AC)
                .application("AC sortie onduleur → tableau STEG")
                .build();
    }

    /** Returns a Schneider DC breaker rated to protect the panel string. */
    public Optional<Equipment> selectDcBreaker(double powerKw) {
        // Tunisia residential strings are typically 1 to 2 strings of 9-12 A;
        // we pick a calibre that covers ~1.25 x the expected string current.
        int target = dcBreakerRating(powerKw);
        return pickBreaker(EquipmentType.CIRCUIT_BREAKER_DC, target, null);
    }

    /** Returns a Schneider AC breaker matching the inverter output. */
    public Optional<Equipment> selectAcBreaker(double powerKw, String phase) {
        int target = acBreakerRating(powerKw, phase);
        return pickBreaker(EquipmentType.CIRCUIT_BREAKER_AC, target, phase);
    }

    public BigDecimal totalKitPrice(Equipment inverter, Equipment dcBreaker,
                                    Equipment acBreaker) {
        BigDecimal total = BigDecimal.ZERO;
        if (inverter != null && inverter.getPrice() != null) {
            total = total.add(inverter.getPrice());
        }
        if (dcBreaker != null && dcBreaker.getPrice() != null) {
            total = total.add(dcBreaker.getPrice());
        }
        if (acBreaker != null && acBreaker.getPrice() != null) {
            total = total.add(acBreaker.getPrice());
        }
        return total;
    }

    // ───────────────────────────────────────────────────────────────────
    // Internal helpers
    // ───────────────────────────────────────────────────────────────────

    private Optional<Equipment> pickBreaker(EquipmentType type, int targetRatingA,
                                            String phase) {
        return equipmentRepository.findByType(type).stream()
                .filter(e -> phase == null || matchesPhase(e, phase))
                .map(e -> new BreakerCandidate(e, readInt(e.getSpecifications(), "ratingA")))
                .filter(c -> c.rating() != null)
                .filter(c -> c.rating() >= targetRatingA)
                .min(Comparator.comparingInt(BreakerCandidate::rating))
                .map(BreakerCandidate::equipment);
    }

    private record BreakerCandidate(Equipment equipment, Integer rating) {}

    private double powerKw(Equipment e) {
        return e.getNominalPower() != null ? e.getNominalPower() / 1000.0 : 0.0;
    }

    private boolean matchesPhase(Equipment e, String phase) {
        if (phase == null) return true;
        String p = readPhase(e);
        return p == null || p.equalsIgnoreCase(phase);
    }

    private String readPhase(Equipment e) {
        return readString(e.getSpecifications(), "phase");
    }

    private double dcSection(double powerKw) {
        if (powerKw <= 3.0) return 4.0;
        if (powerKw <= 6.0) return 6.0;
        return 10.0;
    }

    private double acSection(double powerKw) {
        if (powerKw <= 3.0) return 2.5;
        if (powerKw <= 6.0) return 4.0;
        return 6.0;
    }

    private int dcBreakerRating(double powerKw) {
        if (powerKw <= 3.0) return 16;
        if (powerKw <= 5.0) return 25;
        if (powerKw <= 8.0) return 32;
        return 40;
    }

    private int acBreakerRating(double powerKw, String phase) {
        boolean tri = "TRI".equalsIgnoreCase(phase);
        // I = P / U, calibre = 1.25 x I, rounded up to standard rating
        double current = (powerKw * 1000.0) / (tri ? 400.0 : 230.0);
        double calibre = current * 1.25;
        if (calibre <= 16) return 16;
        if (calibre <= 20) return 20;
        if (calibre <= 25) return 25;
        if (calibre <= 32) return 32;
        if (calibre <= 40) return 40;
        return 50;
    }

    private static String readString(String json, String key) {
        if (json == null) return null;
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) return null;
        int colon = json.indexOf(':', idx);
        int quote = json.indexOf('"', colon + 1);
        if (quote < 0) return null;
        int end = json.indexOf('"', quote + 1);
        return end < 0 ? null : json.substring(quote + 1, end);
    }

    private static Integer readInt(String json, String key) {
        if (json == null) return null;
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) return null;
        int colon = json.indexOf(':', idx);
        if (colon < 0) return null;
        int i = colon + 1;
        while (i < json.length() && Character.isWhitespace(json.charAt(i))) i++;
        int start = i;
        while (i < json.length() && "-0123456789".indexOf(json.charAt(i)) >= 0) i++;
        if (start == i) return null;
        try {
            return Integer.parseInt(json.substring(start, i));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
