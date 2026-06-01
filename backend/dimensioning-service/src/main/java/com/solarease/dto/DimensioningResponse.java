package com.solarease.dto;

import com.solarease.entity.RoofCharacteristic;
import com.solarease.entity.SolarInstallation;
import com.solarease.enums.DimensioningStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DimensioningResponse {

    private Long id;
    private Long projectId;
    private RoofCharacteristic roof;
    private SolarInstallation installation;
    private DimensioningStatus status;
    private LocalDateTime createdAt;
    private String aiRecommendation;
    private String panelType; // "CLASSIC" or "NIGHT_PANEL"
    private FinancialMetrics financials; // Financial projections for the project
    /**
     * Structured RAG-based installer recommendation produced by
     * {@code DecisionSupportService}. Optional: the legacy {@code aiRecommendation}
     * still carries the same content as a single string for the PDF.
     */
    private com.solarease.rag.InstallerRecommendationDto installerRecommendation;
}
