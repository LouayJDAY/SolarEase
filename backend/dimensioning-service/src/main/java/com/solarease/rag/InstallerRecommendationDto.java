package com.solarease.rag;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Structured installer-facing recommendation produced by
 * {@code DecisionSupportService}. Replaces the previous free-form text output
 * so the frontend can build clear UI cards (verdict, kit, alerts, arguments).
 *
 * <p>The DTO is intentionally JSON-friendly: it can be serialised straight
 * into the {@code DimensioningResponse} body and consumed by the React
 * frontend, the PDF generator and the Postman collection without any
 * additional shaping.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstallerRecommendationDto {

    /** {@code OK}, {@code ATTENTION}, {@code NON_COMPATIBLE}. */
    private String verdict;

    /** 0 to 100. */
    private int compatibilityScore;

    private RecommendedKit recommendedKit;

    /** Up to two close inverters from the company catalog. */
    private List<KitInverter> alternatives;

    /** Field-relevant warnings (oversized cable, missing margin, ...). */
    private List<String> alerts;

    /** Sales arguments the installer can copy into the client devis. */
    private List<String> clientArguments;

    /** Practical site checklist (parafoudre, ancrage, section minimale, ...). */
    private List<String> terrainChecklist;

    /** Short identifiers of the {@code knowledge_chunks} that informed this output. */
    private List<String> ragSources;

    /** Free-text summary destined for the PDF report. May be null on fallback. */
    private String narrativeSummary;

    /** True when the LLM was unreachable: only deterministic data is filled in. */
    private boolean fallback;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedKit {
        private KitInverter inverter;
        private KitCable dcCable;
        private KitCable acCable;
        private KitBreaker dcBreaker;
        private KitBreaker acBreaker;
        private BigDecimal totalKitPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KitInverter {
        private Long equipmentId;
        private String brand;
        private String model;
        private double powerKw;
        private String phase;
        private BigDecimal price;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KitCable {
        private double sectionMm2;
        private String brand;
        private String standard;
        private String application; // DC string / AC inverter output
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KitBreaker {
        private Long equipmentId;
        private String brand;
        private String reference; // Schneider Acti9 / iC60N reference
        private int ratingA;
        private String application;
        private BigDecimal price;
    }
}
