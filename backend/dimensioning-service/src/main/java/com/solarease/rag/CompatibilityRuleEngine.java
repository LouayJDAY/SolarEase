package com.solarease.rag;

import com.solarease.entity.Equipment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Computes a 0..100 compatibility score between the requested installation and
 * the kit produced by {@link EquipmentSelectionService}. The score is broken
 * down into four criteria so the resulting verdict is explainable.
 *
 * <p>The score is deterministic and entirely independent from the LLM, which
 * lets us guarantee that the same input always produces the same verdict.</p>
 */
@Service
@Slf4j
public class CompatibilityRuleEngine {

    public Result evaluate(double requiredKw, Equipment inverter,
                            InstallerRecommendationDto.KitCable dcCable,
                            Equipment dcBreaker, Equipment acBreaker) {
        int score = 0;
        List<String> alerts = new ArrayList<>();

        // ── Inverter sizing (40 pts) ──────────────────────────────────
        double inverterKw = inverter != null && inverter.getNominalPower() != null
                ? inverter.getNominalPower() / 1000.0
                : 0.0;
        double ratio = inverterKw == 0.0 ? 0.0 : inverterKw / Math.max(requiredKw, 0.1);
        if (ratio >= 0.95 && ratio <= 1.15) {
            score += 40;
        } else if (ratio >= 0.90 && ratio < 0.95) {
            score += 25;
            alerts.add(String.format(
                    "Onduleur à %.0f%% de la puissance crête : marge réduite en été, "
                            + "envisager un modèle légèrement supérieur.",
                    ratio * 100));
        } else if (ratio > 1.15 && ratio <= 1.30) {
            score += 25;
            alerts.add(String.format(
                    "Onduleur sur-dimensionné (%.0f%% de la puissance) : "
                            + "rendement réduit à charge partielle.",
                    ratio * 100));
        } else if (ratio < 0.90 && ratio > 0) {
            score += 5;
            alerts.add("Onduleur sous-dimensionné : risque d'écrêtage permanent.");
        } else if (ratio > 1.30) {
            score += 5;
            alerts.add("Onduleur très sur-dimensionné par rapport au champ PV.");
        } else {
            alerts.add("Onduleur introuvable dans le catalogue société pour cette puissance.");
        }

        // ── Phase compliance (20 pts) ─────────────────────────────────
        String invPhase = phaseOf(inverter);
        boolean shouldBeTri = requiredKw >= 5.5;
        if (invPhase == null) {
            score += 10;
        } else if ((shouldBeTri && "TRI".equalsIgnoreCase(invPhase))
                || (!shouldBeTri && "MONO".equalsIgnoreCase(invPhase))) {
            score += 20;
        } else {
            score += 5;
            alerts.add(shouldBeTri
                    ? "Au-dessus de 5,5 kWc, la STEG impose un raccordement triphasé."
                    : "Onduleur triphasé pour une installation < 5,5 kWc : choisir un mono.");
        }

        // ── DC cable section (20 pts) ─────────────────────────────────
        if (dcCable != null) {
            double minimum = expectedDcSection(requiredKw);
            if (dcCable.getSectionMm2() >= minimum) {
                score += 20;
            } else {
                score += 5;
                alerts.add(String.format(
                        "Section DC %.1f mm² insuffisante : %1.1f mm² recommandé pour %.1f kWc.",
                        dcCable.getSectionMm2(), minimum, requiredKw));
            }
        }

        // ── Breakers presence (20 pts) ────────────────────────────────
        if (dcBreaker != null) {
            score += 10;
        } else {
            alerts.add("Aucun disjoncteur DC trouvé dans le stock pour cette puissance.");
        }
        if (acBreaker != null) {
            score += 10;
        } else {
            alerts.add("Aucun disjoncteur AC trouvé dans le stock pour cette puissance.");
        }

        score = Math.max(0, Math.min(100, score));

        String verdict;
        if (score >= 85) {
            verdict = "OK";
        } else if (score >= 60) {
            verdict = "ATTENTION";
        } else {
            verdict = "NON_COMPATIBLE";
        }

        return new Result(score, verdict, alerts);
    }

    private double expectedDcSection(double powerKw) {
        if (powerKw <= 3.0) return 4.0;
        if (powerKw <= 6.0) return 6.0;
        return 10.0;
    }

    private String phaseOf(Equipment e) {
        if (e == null || e.getSpecifications() == null) return null;
        String s = e.getSpecifications();
        int idx = s.indexOf("\"phase\"");
        if (idx < 0) return null;
        int colon = s.indexOf(':', idx);
        int quote = s.indexOf('"', colon + 1);
        if (quote < 0) return null;
        int end = s.indexOf('"', quote + 1);
        return end < 0 ? null : s.substring(quote + 1, end);
    }

    /** Compatibility evaluation result. */
    public record Result(int score, String verdict, List<String> alerts) {}
}
