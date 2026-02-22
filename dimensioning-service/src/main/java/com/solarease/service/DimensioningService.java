package com.solarease.service;

import com.solarease.client.PvgisClient;
import com.solarease.dto.DimensioningRequest;
import com.solarease.dto.DimensioningResponse;
import com.solarease.entity.Dimensioning;
import com.solarease.entity.RoofCharacteristic;
import com.solarease.entity.SolarInstallation;
import com.solarease.enums.DimensioningStatus;
import com.solarease.enums.Orientation;
import com.solarease.repository.DimensioningRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DimensioningService {

    private final DimensioningRepository dimensioningRepository;
    private final PvgisClient pvgisClient;
    private final DecisionSupportService decisionSupportService; // New Dependency

    // Constants for calculation
    private static final double PANEL_POWER_W = 400.0; // 400 Watts per panel
    private static final double PANEL_AREA_M2 = 1.9; // approx 1.9 m2 per panel
    private static final double AVERAGE_IRRADIANCE = 1600.0; // kWh/kWp/year (Tunisia avg fallback)
    private static final double CO2_FACTOR_KG_KWH = 0.5; // kg CO2 saved per kWh

    @Transactional
    public DimensioningResponse calculateDimensioning(DimensioningRequest request) {
        // 1. Save Roof Info
        RoofCharacteristic roof = RoofCharacteristic.builder()
                .area(request.getArea())
                .inclination(request.getInclination())
                .orientation(request.getOrientation())
                .type(request.getRoofType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();

        // 2. Perform Calculation
        SolarInstallation installation = performCalculation(roof);

        // 2b. Generate AI Recommendation (RAG)
        // We create a temporary response object just to pass context to the AI service
        DimensioningResponse tempResponse = DimensioningResponse.builder()
                .installation(installation)
                .roof(roof)
                .build();
        String aiRecommendation = decisionSupportService.generateAiRecommendation(tempResponse);

        // 3. Save Context
        Dimensioning dimensioning = Dimensioning.builder()
                .projectId(request.getProjectId())
                .roofCharacteristic(roof)
                .solarInstallation(installation)
                .status(DimensioningStatus.COMPLETED)
                .aiRecommendation(aiRecommendation)
                .build();

        Dimensioning saved = dimensioningRepository.save(dimensioning);
        return mapToResponse(saved);
    }

    private SolarInstallation performCalculation(RoofCharacteristic roof) {
        // Simple logic for checking
        // Number of panels that fit in the area
        // Let's assume 80% usable area due to obstacles/spacing
        double usableArea = roof.getArea() * 0.8;
        int panelCount = (int) (usableArea / PANEL_AREA_M2);

        if (panelCount < 1) {
            return SolarInstallation.builder()
                    .panelCount(0)
                    .totalCapacityKw(0.0)
                    .estimatedAnnualProductionKwh(0.0)
                    .inverterModel("None")
                    .co2Savings(0.0)
                    .monthlySavings(0.0)
                    .build();
        }

        double totalCapacityKw = (panelCount * PANEL_POWER_W) / 1000.0;

        double estimatedProduction;
        
        // Try calling PVGIS first
        if (roof.getLatitude() != null && roof.getLongitude() != null) {
            double aspect = convertOrientationToDegrees(roof.getOrientation());
            double pvgisProduction = pvgisClient.getAnnualProduction(
                    roof.getLatitude(), 
                    roof.getLongitude(), 
                    totalCapacityKw, 
                    roof.getInclination(), 
                    aspect
            );
            
            if (pvgisProduction > 0) {
                estimatedProduction = pvgisProduction;
                log.info("Calculated production using PVGIS for {} kWp: {} kWh", totalCapacityKw, estimatedProduction);
            } else {
                log.warn("PVGIS failed, falling back to static calculation");
                estimatedProduction = calculateStaticProduction(roof, totalCapacityKw);
            }
        } else {
            estimatedProduction = calculateStaticProduction(roof, totalCapacityKw);
        }
        
        // Inverter choice
        String inverter = totalCapacityKw < 3.0 ? "Micro-Inverter System" : "Central String Inverter 5kW";
        if (totalCapacityKw > 6.0) inverter = "Three-Phase Hybrid Inverter 10kW";

        // Savings (Approx 0.2 TND per kWh)
        double annualSavings = estimatedProduction * 0.2;

        return SolarInstallation.builder()
                .panelCount(panelCount)
                .totalCapacityKw(Math.round(totalCapacityKw * 100.0) / 100.0)
                .estimatedAnnualProductionKwh(Math.round(estimatedProduction * 100.0) / 100.0)
                .inverterModel(inverter)
                .monthlySavings(Math.round((annualSavings / 12) * 100.0) / 100.0)
                .co2Savings(Math.round(estimatedProduction * CO2_FACTOR_KG_KWH * 100.0) / 100.0)
                .build();
    }

    private double calculateStaticProduction(RoofCharacteristic roof, double totalCapacityKw) {
        // Efficiency based on Orientation
        double orientationFactor = getOrientationFactor(roof.getOrientation());
        
        // Efficiency based on Inclination (Simplified: optimal is 30)
        double inclinationFactor = 1.0 - (Math.abs(30 - roof.getInclination()) * 0.005);
        if (inclinationFactor < 0.5) inclinationFactor = 0.5;

        return totalCapacityKw * AVERAGE_IRRADIANCE * orientationFactor * inclinationFactor;
    }
    
    private double convertOrientationToDegrees(Orientation orientation) {
        // PVGIS: 0=South, -90=East, 90=West, 180=North
        switch (orientation) {
            case SOUTH: return 0.0;
            case SOUTH_EAST: return -45.0;
            case EAST: return -90.0;
            case NORTH_EAST: return -135.0;
            case NORTH: return 180.0;
            case NORTH_WEST: return 135.0;
            case WEST: return 90.0;
            case SOUTH_WEST: return 45.0;
            default: return 0.0;
        }
    }

    private double getOrientationFactor(Orientation orientation) {
        switch (orientation) {
            case SOUTH: return 1.0;
            case SOUTH_EAST:
            case SOUTH_WEST: return 0.95;
            case EAST:
            case WEST: return 0.85;
            case NORTH_EAST:
            case NORTH_WEST: return 0.70;
            case NORTH: return 0.60;
            default: return 1.0;
        }
    }

    public List<DimensioningResponse> getDimensioningByProjectId(Long projectId) {
        return dimensioningRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DimensioningResponse getDimensioningById(Long id) {
        return dimensioningRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Dimensioning not found"));
    }

    private DimensioningResponse mapToResponse(Dimensioning d) {
        return DimensioningResponse.builder()
                .id(d.getId())
                .projectId(d.getProjectId())
                .roof(d.getRoofCharacteristic())
                .installation(d.getSolarInstallation())
                .status(d.getStatus())
                .aiRecommendation(d.getAiRecommendation())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
