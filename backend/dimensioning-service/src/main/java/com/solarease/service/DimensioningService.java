package com.solarease.service;

import com.solarease.client.PvgisClient;
import com.solarease.dto.DimensioningRequest;
import com.solarease.dto.DimensioningResponse;
import com.solarease.dto.ComparisonResponse;
import com.solarease.entity.Dimensioning;
import com.solarease.entity.Equipment;
import com.solarease.entity.RoofCharacteristic;

import com.solarease.entity.SolarInstallation;
import com.solarease.enums.DimensioningStatus;
import com.solarease.enums.Orientation;
import com.solarease.repository.DimensioningRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DimensioningService {

    private final DimensioningRepository dimensioningRepository;
    private final PvgisClient pvgisClient;
    private final EquipmentService equipmentService;
    private final DecisionSupportService decisionSupportService; // New Dependency
    private final FinancialService financialService; // New Financial Service
    private final PdfGenerationService pdfGenerationService; // For Report Generation

    // Constants for calculation
    private static final double DEFAULT_PANEL_POWER_W = 400.0;
    private static final double DEFAULT_PANEL_AREA_M2 = 1.9;
    private static final double USABLE_SURFACE_COEFFICIENT = 0.7;
    private static final double AVERAGE_IRRADIANCE = 1600.0; // kWh/kWp/year (Tunisia avg fallback)
    private static final double ELECTRICITY_PRICE_TND_KWH = 0.28; // Tunisie: 0.25 - 0.30
    private static final double INSTALLATION_LABOR_RATE = 0.15; // Tunisie: ~15%
    private static final double CO2_FACTOR_KG_KWH = 0.6; // Tunisie: ~0.6 kg CO2/kWh

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

        // Determine panel type
        boolean isNightPanel = "NIGHT_PANEL".equalsIgnoreCase(request.getPanelType());
        
        // 1b. Fetch Equipment (Panel & Inverter)
        Equipment panel;
        if (isNightPanel) {
            panel = getNightPanel(request.getNightPanelId());
        } else {
            panel = getPanel(request.getPanelId());
        }
        Equipment inverter = getInverter(request.getInverterId());

        // 2. Perform Calculation
        SolarInstallation installation;
        if (isNightPanel) {
            double dailyConsumption = (request.getDailyConsumptionKwh() != null && request.getDailyConsumptionKwh() > 0)
                    ? request.getDailyConsumptionKwh() : 15.0; // Default 15 kWh/day
            installation = performNightPanelCalculation(roof, panel, inverter, dailyConsumption);
        } else {
            installation = performCalculation(roof, panel, inverter);
        }

        // 2b. Generate AI Recommendation (hybrid pgvector RAG)
        com.solarease.dto.FinancialMetrics metrics = financialService.calculateMetrics(installation);

        String aiRecommendation = "AI Recommendation Unavailable (Service Down)";
        com.solarease.rag.InstallerRecommendationDto installerRecommendation = null;
        try {
            DimensioningResponse tempResponse = DimensioningResponse.builder()
                    .installation(installation)
                    .roof(roof)
                    .financials(metrics)
                    .panelType(isNightPanel ? "NIGHT_PANEL" : "CLASSIC")
                    .build();
            DecisionSupportService.Result rag = decisionSupportService.generate(
                    tempResponse, panel, inverter);
            installerRecommendation = rag.recommendation();
            aiRecommendation = rag.narrativeSummary();
        } catch (Exception e) {
            log.error("Failed to generate AI recommendation: {}", e.getMessage());
        }

        // 3. Save Context
        Dimensioning dimensioning = Dimensioning.builder()
                .projectId(request.getProjectId())
                .roofCharacteristic(roof)
                .solarInstallation(installation)
                .panel(panel)
                .inverter(inverter)
                .panelType(isNightPanel ? "NIGHT_PANEL" : "CLASSIC")
                .status(DimensioningStatus.COMPLETED)
                .aiRecommendation(aiRecommendation)
                .build();

        Dimensioning saved = dimensioningRepository.save(dimensioning);
        DimensioningResponse response = mapToResponse(saved);
        response.setInstallerRecommendation(installerRecommendation);
        return response;
    }

    /**
     * Compare Classic vs Night Panel dimensioning for the same project parameters
     */
    @Transactional
    public ComparisonResponse compareDimensioning(DimensioningRequest request) {
        // Calculate Classic
        DimensioningRequest classicRequest = DimensioningRequest.builder()
                .projectId(request.getProjectId())
                .area(request.getArea())
                .inclination(request.getInclination())
                .orientation(request.getOrientation())
                .roofType(request.getRoofType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .panelId(request.getPanelId())
                .inverterId(request.getInverterId())
                .panelType("CLASSIC")
                .dailyConsumptionKwh(request.getDailyConsumptionKwh())
                .build();
        DimensioningResponse classicResult = calculateDimensioning(classicRequest);

        // Calculate Night Panel
        DimensioningRequest nightRequest = DimensioningRequest.builder()
                .projectId(request.getProjectId())
                .area(request.getArea())
                .inclination(request.getInclination())
                .orientation(request.getOrientation())
                .roofType(request.getRoofType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .nightPanelId(request.getNightPanelId())
                .inverterId(request.getInverterId())
                .panelType("NIGHT_PANEL")
                .dailyConsumptionKwh(request.getDailyConsumptionKwh())
                .build();
        DimensioningResponse nightResult = calculateDimensioning(nightRequest);

        // Build 24h curves
        double dailyConsumption = (request.getDailyConsumptionKwh() != null && request.getDailyConsumptionKwh() > 0)
                ? request.getDailyConsumptionKwh() : 15.0;
        double classicDailyProd = classicResult.getInstallation().getEstimatedAnnualProductionKwh() / 365.0;
        double nightDailyProd = nightResult.getInstallation().getEstimatedAnnualProductionKwh() / 365.0;
        double storageKwh = nightResult.getInstallation().getStorageCapacityKwh() != null
                ? nightResult.getInstallation().getStorageCapacityKwh() : 0.0;

        List<ComparisonResponse.HourlyData> classicCurve = generateHourlyCurve(classicDailyProd, dailyConsumption, 0, false);
        List<ComparisonResponse.HourlyData> nightCurve = generateHourlyCurve(nightDailyProd, dailyConsumption, storageKwh, true);

        // Calculate deltas
        double prodDiff = nightResult.getInstallation().getEstimatedAnnualProductionKwh()
                - classicResult.getInstallation().getEstimatedAnnualProductionKwh();
        double costDiff = nightResult.getInstallation().getEstimatedCost()
                - classicResult.getInstallation().getEstimatedCost();
        double selfConsGain = (nightResult.getInstallation().getSelfConsumptionRate() != null
                ? nightResult.getInstallation().getSelfConsumptionRate() : 0.0) * 100
                - 30.0; // Classic assumed ~30%
        double paybackDiff = nightResult.getFinancials().getPaybackPeriodYears()
                - classicResult.getFinancials().getPaybackPeriodYears();
        double roiDiff = nightResult.getFinancials().getRoiPercentage()
                - classicResult.getFinancials().getRoiPercentage();
        double co2Diff = nightResult.getInstallation().getCo2Savings()
                - classicResult.getInstallation().getCo2Savings();

        return ComparisonResponse.builder()
                .classic(classicResult)
                .nightPanel(nightResult)
                .productionDifferenceKwh(Math.round(prodDiff * 100.0) / 100.0)
                .costDifferenceTnd(Math.round(costDiff * 100.0) / 100.0)
                .selfConsumptionGainPercent(Math.round(selfConsGain * 10.0) / 10.0)
                .paybackDifferenceYears(Math.round(paybackDiff * 10.0) / 10.0)
                .roiDifferencePercent(Math.round(roiDiff * 100.0) / 100.0)
                .co2SavingsDifferenceKg(Math.round(co2Diff * 100.0) / 100.0)
                .classicHourlyCurve(classicCurve)
                .nightPanelHourlyCurve(nightCurve)
                .build();
    }

    public ByteArrayInputStream getDimensioningPdfReport(Long id) {
        Dimensioning dimensioning = dimensioningRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dimensioning not found with id: " + id));

        // Reuse the structured recommendation so the PDF can render the kit
        // table (inverter, cables, Schneider breakers) instead of a single
        // free-form paragraph. Failures are tolerated -- the PDF still works
        // with the legacy aiRecommendation field.
        com.solarease.rag.InstallerRecommendationDto recommendation = null;
        try {
            com.solarease.dto.FinancialMetrics metrics =
                    financialService.calculateMetrics(dimensioning.getSolarInstallation());
            DimensioningResponse temp = DimensioningResponse.builder()
                    .installation(dimensioning.getSolarInstallation())
                    .roof(dimensioning.getRoofCharacteristic())
                    .financials(metrics)
                    .panelType(dimensioning.getPanelType())
                    .build();
            recommendation = decisionSupportService.generate(
                    temp, dimensioning.getPanel(), dimensioning.getInverter())
                    .recommendation();
        } catch (Exception e) {
            log.warn("Could not enrich PDF with structured kit, falling back: {}",
                    e.getMessage());
        }

        return pdfGenerationService.generateDimensioningReport(dimensioning, recommendation);
    }

    private Equipment getPanel(Long panelId) {

        if (panelId != null) {
            return equipmentService.getEquipmentById(panelId);
        }
        // Try to find any panel in DB
        List<Equipment> panels = equipmentService.getEquipmentByType(com.solarease.enums.EquipmentType.SOLAR_PANEL);
        return panels.isEmpty() ? null : panels.get(0);
    }

    private Equipment getInverter(Long inverterId) {
        if (inverterId != null) {
            return equipmentService.getEquipmentById(inverterId);
        }
        // Try to find any inverter in DB
        List<Equipment> inverters = equipmentService.getEquipmentByType(com.solarease.enums.EquipmentType.INVERTER);
        return inverters.isEmpty() ? null : inverters.get(0);
    }

    private Equipment getNightPanel(Long nightPanelId) {
        if (nightPanelId != null) {
            return equipmentService.getEquipmentById(nightPanelId);
        }
        List<Equipment> nightPanels = equipmentService.getEquipmentByType(com.solarease.enums.EquipmentType.NIGHT_PANEL);
        return nightPanels.isEmpty() ? null : nightPanels.get(0);
    }

    /**
     * Night Panel calculation: same as classic + storage/self-consumption calculations
     */
    private SolarInstallation performNightPanelCalculation(RoofCharacteristic roof, Equipment panel, Equipment inverter, double dailyConsumption) {
        // Base calculation (same as classic but with night panel specs)
        SolarInstallation baseInstallation = performCalculation(roof, panel, inverter);

        if (baseInstallation.getPanelCount() == 0) {
            return baseInstallation;
        }

        // Night Panel specifics
        double storagePerPanel = (panel != null && panel.getStorageCapacityKwh() != null)
                ? panel.getStorageCapacityKwh() : 1.2; // Default 1.2 kWh per panel
        double totalStorageKwh = baseInstallation.getPanelCount() * storagePerPanel;

        // Daily production
        double dailyProductionKwh = baseInstallation.getEstimatedAnnualProductionKwh() / 365.0;

        // Self-consumption calculation
        // Classic panels: ~30% self-consumption (surplus goes to grid)
        // Night panels: store daytime surplus → use at night
        double daytimeConsumption = dailyConsumption * 0.4; // 40% of consumption is during day
        double nighttimeConsumption = dailyConsumption * 0.6; // 60% at night

        // How much surplus can be stored
        double daytimeSurplus = Math.max(0, dailyProductionKwh - daytimeConsumption);
        double actualStored = Math.min(daytimeSurplus, totalStorageKwh); // Can't store more than capacity
        double nightCoverage = Math.min(actualStored, nighttimeConsumption);

        // Self-consumption rate
        double directConsumption = Math.min(dailyProductionKwh, daytimeConsumption);
        double totalSelfConsumed = directConsumption + nightCoverage;
        double selfConsumptionRate = Math.min(1.0, totalSelfConsumed / dailyConsumption);

        // Night coverage rate
        double nightCoverageRate = nighttimeConsumption > 0 ? Math.min(1.0, nightCoverage / nighttimeConsumption) : 0;

        // Enhanced savings: self-consumed energy saves more (no grid losses)
        double enhancedAnnualSavings = totalSelfConsumed * 365 * ELECTRICITY_PRICE_TND_KWH;
        double gridSurplus = Math.max(0, dailyProductionKwh - totalSelfConsumed);
        double gridSavings = gridSurplus * 365 * 0.10; // Lower feed-in tariff
        double totalAnnualSavings = enhancedAnnualSavings + gridSavings;

        return SolarInstallation.builder()
                .panelCount(baseInstallation.getPanelCount())
                .panelModel(baseInstallation.getPanelModel())
                .totalCapacityKw(baseInstallation.getTotalCapacityKw())
                .estimatedCost(baseInstallation.getEstimatedCost())
                .estimatedAnnualProductionKwh(baseInstallation.getEstimatedAnnualProductionKwh())
                .inverterModel(baseInstallation.getInverterModel())
                .monthlySavings(Math.round((totalAnnualSavings / 12) * 100.0) / 100.0)
                .co2Savings(baseInstallation.getCo2Savings())
                .isNightPanel(true)
                .storageCapacityKwh(Math.round(totalStorageKwh * 100.0) / 100.0)
                .selfConsumptionRate(Math.round(selfConsumptionRate * 1000.0) / 1000.0)
                .nightCoverageRate(Math.round(nightCoverageRate * 1000.0) / 1000.0)
                .dailyProductionKwh(Math.round(dailyProductionKwh * 100.0) / 100.0)
                .nightlyConsumptionKwh(Math.round(nightCoverage * 100.0) / 100.0)
                .build();
    }

    /**
     * Generate a 24-hour production/consumption curve
     */
    private List<ComparisonResponse.HourlyData> generateHourlyCurve(double dailyProdKwh, double dailyConsKwh, double storageKwh, boolean hasStorage) {
        // Solar production distribution (bell curve peaking at noon, Tunisia)
        double[] solarProfile = {0, 0, 0, 0, 0, 0.02, 0.05, 0.08, 0.11, 0.13, 0.14, 0.15, 0.14, 0.13, 0.11, 0.08, 0.05, 0.02, 0, 0, 0, 0, 0, 0};
        // Consumption profile (morning + evening peaks)
        double[] consProfile = {0.02, 0.02, 0.01, 0.01, 0.01, 0.02, 0.05, 0.07, 0.06, 0.04, 0.03, 0.04, 0.05, 0.04, 0.03, 0.04, 0.05, 0.07, 0.08, 0.09, 0.08, 0.05, 0.03, 0.02};

        List<ComparisonResponse.HourlyData> curve = new ArrayList<>();
        double batteryLevel = 0;

        for (int h = 0; h < 24; h++) {
            double prod = dailyProdKwh * solarProfile[h];
            double cons = dailyConsKwh * consProfile[h];
            double stored = 0;
            double fromStorage = 0;

            if (hasStorage) {
                double surplus = prod - cons;
                if (surplus > 0) {
                    // Store surplus
                    stored = Math.min(surplus, storageKwh - batteryLevel);
                    batteryLevel += stored;
                } else if (surplus < 0) {
                    // Draw from storage
                    fromStorage = Math.min(-surplus, batteryLevel);
                    batteryLevel -= fromStorage;
                }
            }

            curve.add(ComparisonResponse.HourlyData.builder()
                    .hour(h)
                    .production(Math.round(prod * 100.0) / 100.0)
                    .consumption(Math.round(cons * 100.0) / 100.0)
                    .stored(Math.round(stored * 100.0) / 100.0)
                    .fromStorage(Math.round(fromStorage * 100.0) / 100.0)
                    .build());
        }
        return curve;
    }

    private SolarInstallation performCalculation(RoofCharacteristic roof, Equipment panel, Equipment inverter) {
        // Use equipment values if available, else defaults
        double panelPowerW = (panel != null && panel.getNominalPower() != null) ? panel.getNominalPower() : DEFAULT_PANEL_POWER_W;
        double panelAreaM2 = (panel != null && panel.getArea() != null) ? panel.getArea() : DEFAULT_PANEL_AREA_M2;
        String inverterModel = (inverter != null) ? inverter.getModel() : "Generic Inverter";

        // Number of panels that fit in the area
        // Tunisie (validé): ~70% de surface réellement exploitable
        double usableArea = roof.getArea() * USABLE_SURFACE_COEFFICIENT;
        int panelCount = (int) (usableArea / panelAreaM2);

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

        double totalCapacityKw = (panelCount * panelPowerW) / 1000.0;

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
        String finalInverterModel;
        if (inverter != null) {
            finalInverterModel = inverter.getModel();
        } else {
            // Fallback logic if no specific inverter selected
            finalInverterModel = totalCapacityKw < 3.0 ? "Micro-Inverter System" : "Central String Inverter 5kW";
            if (totalCapacityKw > 6.0) finalInverterModel = "Three-Phase Hybrid Inverter 10kW";
        }

        // Savings (Tunisie: 0.25 - 0.30 TND/kWh)
        double annualSavings = estimatedProduction * ELECTRICITY_PRICE_TND_KWH;

        // Cost Calculation
        double panelPrice = (panel != null && panel.getPrice() != null) ? panel.getPrice().doubleValue() : 450.0;
        double inverterPrice = (inverter != null && inverter.getPrice() != null) ? inverter.getPrice().doubleValue() : 2500.0;
        
        double totalMaterialCost = (panelCount * panelPrice) + inverterPrice;
        double installationLabor = totalMaterialCost * INSTALLATION_LABOR_RATE;
        double totalProjectCost = totalMaterialCost + installationLabor;

        return SolarInstallation.builder()
                .panelCount(panelCount)
                .panelModel(panel != null ? panel.getModel() : "Default 400W Panel")
                .totalCapacityKw(Math.round(totalCapacityKw * 100.0) / 100.0)
                .estimatedCost(Math.round(totalProjectCost * 100.0) / 100.0)
                .estimatedAnnualProductionKwh(Math.round(estimatedProduction * 100.0) / 100.0)
                .inverterModel(finalInverterModel)
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
                .orElseThrow(() -> new EntityNotFoundException("Dimensioning not found with id: " + id));
    }

    /**
     * Re-runs the RAG pipeline for an already-persisted dimensioning. Useful
     * when the catalog or the knowledge base has been refreshed and the
     * installer wants an updated kit/verdict without redoing the full
     * dimensioning.
     */
    @Transactional
    public DimensioningResponse regenerateRecommendation(Long id) {
        Dimensioning d = dimensioningRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Dimensioning not found with id: " + id));

        com.solarease.dto.FinancialMetrics metrics =
                financialService.calculateMetrics(d.getSolarInstallation());
        DimensioningResponse temp = DimensioningResponse.builder()
                .installation(d.getSolarInstallation())
                .roof(d.getRoofCharacteristic())
                .financials(metrics)
                .panelType(d.getPanelType())
                .build();

        DecisionSupportService.Result rag = decisionSupportService.generate(
                temp, d.getPanel(), d.getInverter());
        d.setAiRecommendation(rag.narrativeSummary());
        Dimensioning saved = dimensioningRepository.save(d);

        DimensioningResponse response = mapToResponse(saved);
        response.setInstallerRecommendation(rag.recommendation());
        return response;
    }

    private DimensioningResponse mapToResponse(Dimensioning d) {
        return DimensioningResponse.builder()
                .id(d.getId())
                .projectId(d.getProjectId())
                .roof(d.getRoofCharacteristic())
                .installation(d.getSolarInstallation())
                .status(d.getStatus())
                .aiRecommendation(d.getAiRecommendation())
                .panelType(d.getPanelType() != null ? d.getPanelType() : "CLASSIC")
                .financials(financialService.calculateMetrics(d.getSolarInstallation())) // Calculate financials
                .createdAt(d.getCreatedAt())
                .build();
    }
}
