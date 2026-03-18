package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComparisonResponse {

    private DimensioningResponse classic;
    private DimensioningResponse nightPanel;

    // Comparison deltas
    private Double productionDifferenceKwh;
    private Double costDifferenceTnd;
    private Double selfConsumptionGainPercent; // e.g. +45%
    private Double paybackDifferenceYears;
    private Double roiDifferencePercent;
    private Double co2SavingsDifferenceKg;

    // 24h production curve data (for day/night chart)
    private List<HourlyData> classicHourlyCurve;
    private List<HourlyData> nightPanelHourlyCurve;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlyData {
        private Integer hour; // 0-23
        private Double production; // kWh
        private Double consumption; // kWh
        private Double stored; // kWh (only for night panel)
        private Double fromStorage; // kWh drawn from storage (night hours)
    }
}
