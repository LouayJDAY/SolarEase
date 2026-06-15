package com.solarease.service;

import com.solarease.client.PvgisClient;
import com.solarease.dto.DimensioningRequest;
import com.solarease.dto.DimensioningResponse;
import com.solarease.dto.ComparisonResponse;
import com.solarease.dto.EquipmentSummaryDto;
import com.solarease.entity.Dimensioning;
import com.solarease.entity.Equipment;
import com.solarease.entity.RoofCharacteristic;

import com.solarease.entity.SolarInstallation;
import com.solarease.enums.DimensioningStatus;
import com.solarease.enums.Orientation;
import com.solarease.enums.PanelCategory;
import com.solarease.repository.DimensioningRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solarease.rag.InstallerRecommendationDto;
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
    private final ObjectMapper objectMapper;

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

        // Mode dimensionnement : CLASSIC ou NIGHT_PANEL
        boolean isNightPanel = "NIGHT_PANEL".equalsIgnoreCase(request.getPanelType());

        Equipment panel = isNightPanel
                ? resolveNightPanel(request.getNightPanelId())
                : resolveClassicPanel(request.getPanelId());
        Equipment inverter = getInverter(request.getInverterId());

        SolarInstallation installation;
        if (isNightPanel) {
            double dailyForMetrics = (request.getDailyConsumptionKwh() != null && request.getDailyConsumptionKwh() > 0)
                    ? request.getDailyConsumptionKwh() : 15.0;
            installation = performNightPanelCalculation(
                    roof, panel, inverter, dailyForMetrics,
                    request.getDailyConsumptionKwh(), request.getQuarterlyBillTnd());
        } else {
            installation = performCalculation(
                    roof, panel, inverter,
                    request.getDailyConsumptionKwh(), request.getQuarterlyBillTnd());
        }

        com.solarease.dto.FinancialMetrics metrics = financialService.calculateMetrics(installation);

        String aiRecommendation = "AI Recommendation Unavailable (Service Down)";
        com.solarease.rag.InstallerRecommendationDto installerRecommendation = null;
        String panelTypeCode = isNightPanel ? "NIGHT_PANEL" : "CLASSIC";
        try {
            DimensioningResponse tempResponse = DimensioningResponse.builder()
                    .installation(installation)
                    .roof(roof)
                    .financials(metrics)
                    .panelType(panelTypeCode)
                    .build();
            DecisionSupportService.Result rag = decisionSupportService.generateDeterministic(
                    tempResponse, panel, inverter);
            installerRecommendation = rag.recommendation();
            aiRecommendation = rag.narrativeSummary();
        } catch (Exception e) {
            log.error("Failed to generate AI recommendation: {}", e.getMessage());
        }

        Dimensioning dimensioning = Dimensioning.builder()
                .projectId(request.getProjectId())
                .roofCharacteristic(roof)
                .solarInstallation(installation)
                .panel(panel)
                .inverter(inverter)
                .panelType(panelTypeCode)
                .status(DimensioningStatus.COMPLETED)
                .aiRecommendation(aiRecommendation)
                .installerRecommendationJson(serializeRecommendation(installerRecommendation))
                .build();

        Dimensioning saved = dimensioningRepository.save(dimensioning);
        return mapToResponse(saved);
    }

    /**
     * Compare Classique vs Night Panel for the same project parameters.
     */
    @Transactional
    public ComparisonResponse compareDimensioning(DimensioningRequest request) {
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

        double dailyConsumption = (request.getDailyConsumptionKwh() != null && request.getDailyConsumptionKwh() > 0)
                ? request.getDailyConsumptionKwh() : 15.0;
        double classicDailyProd = classicResult.getInstallation().getEstimatedAnnualProductionKwh() / 365.0;
        double nightDailyProd = nightResult.getInstallation().getEstimatedAnnualProductionKwh() / 365.0;
        double storageKwh = nightResult.getInstallation().getStorageCapacityKwh() != null
                ? nightResult.getInstallation().getStorageCapacityKwh() : 0.0;

        List<ComparisonResponse.HourlyData> classicCurve =
                generateHourlyCurve(classicDailyProd, dailyConsumption, 0, false);
        List<ComparisonResponse.HourlyData> nightCurve =
                generateHourlyCurve(nightDailyProd, dailyConsumption, storageKwh, true);

        double prodDiff = nightResult.getInstallation().getEstimatedAnnualProductionKwh()
                - classicResult.getInstallation().getEstimatedAnnualProductionKwh();
        double costDiff = nightResult.getInstallation().getEstimatedCost()
                - classicResult.getInstallation().getEstimatedCost();
        double selfConsGain = (nightResult.getInstallation().getSelfConsumptionRate() != null
                ? nightResult.getInstallation().getSelfConsumptionRate() : 0.0) * 100 - 30.0;
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

        com.solarease.rag.InstallerRecommendationDto recommendation =
                deserializeRecommendation(dimensioning.getInstallerRecommendationJson());
        if (recommendation == null) {
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
        }

        return pdfGenerationService.generateDimensioningReport(dimensioning, recommendation);
    }

    private Equipment resolveClassicPanel(Long panelId) {
        if (panelId != null) {
            return equipmentService.getEquipmentById(panelId);
        }
        List<Equipment> panels = equipmentService.getEquipmentByType(
                com.solarease.enums.EquipmentType.SOLAR_PANEL);
        return equipmentService.pickDefaultPanel(panels);
    }

    private Equipment resolveNightPanel(Long nightPanelId) {
        if (nightPanelId != null) {
            return equipmentService.getEquipmentById(nightPanelId);
        }
        List<Equipment> panels = equipmentService.getEquipmentByType(
                com.solarease.enums.EquipmentType.NIGHT_PANEL);
        return panels.isEmpty() ? null : panels.get(0);
    }

    private Equipment getInverter(Long inverterId) {
        if (inverterId != null) {
            return equipmentService.getEquipmentById(inverterId);
        }
        List<Equipment> inverters = equipmentService.getEquipmentByType(com.solarease.enums.EquipmentType.INVERTER);
        return inverters.isEmpty() ? null : inverters.get(0);
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

    private SolarInstallation performNightPanelCalculation(
            RoofCharacteristic roof,
            Equipment panel,
            Equipment inverter,
            double dailyConsumption,
            Double dailyConsumptionKwh,
            Double quarterlyBillTnd) {
        SolarInstallation base = performCalculation(
                roof, panel, inverter, dailyConsumptionKwh, quarterlyBillTnd);
        if (base.getPanelCount() == null || base.getPanelCount() < 1) {
            return base;
        }

        double storagePerPanel = (panel != null && panel.getStorageCapacityKwh() != null)
                ? panel.getStorageCapacityKwh() : 1.2;
        double totalStorageKwh = base.getPanelCount() * storagePerPanel;
        double dailyProductionKwh = base.getEstimatedAnnualProductionKwh() / 365.0;

        double daytimeConsumption = dailyConsumption * 0.4;
        double nighttimeConsumption = dailyConsumption * 0.6;
        double daytimeSurplus = Math.max(0, dailyProductionKwh - daytimeConsumption);
        double actualStored = Math.min(daytimeSurplus, totalStorageKwh);
        double nightCoverage = Math.min(actualStored, nighttimeConsumption);

        double directConsumption = Math.min(dailyProductionKwh, daytimeConsumption);
        double totalSelfConsumed = directConsumption + nightCoverage;
        double selfConsumptionRate = Math.min(1.0, totalSelfConsumed / dailyConsumption);
        double nightCoverageRate = nighttimeConsumption > 0
                ? Math.min(1.0, nightCoverage / nighttimeConsumption) : 0;

        double enhancedAnnualSavings = totalSelfConsumed * 365 * ELECTRICITY_PRICE_TND_KWH;
        double gridSurplus = Math.max(0, dailyProductionKwh - totalSelfConsumed);
        double gridSavings = gridSurplus * 365 * 0.10;
        double totalAnnualSavings = enhancedAnnualSavings + gridSavings;

        return SolarInstallation.builder()
                .panelCount(base.getPanelCount())
                .panelModel(base.getPanelModel())
                .totalCapacityKw(base.getTotalCapacityKw())
                .estimatedCost(base.getEstimatedCost())
                .estimatedAnnualProductionKwh(base.getEstimatedAnnualProductionKwh())
                .inverterModel(base.getInverterModel())
                .monthlySavings(Math.round((totalAnnualSavings / 12) * 100.0) / 100.0)
                .co2Savings(base.getCo2Savings())
                .isNightPanel(true)
                .storageCapacityKwh(Math.round(totalStorageKwh * 100.0) / 100.0)
                .selfConsumptionRate(Math.round(selfConsumptionRate * 1000.0) / 1000.0)
                .nightCoverageRate(Math.round(nightCoverageRate * 1000.0) / 1000.0)
                .dailyProductionKwh(Math.round(dailyProductionKwh * 100.0) / 100.0)
                .nightlyConsumptionKwh(Math.round(nightCoverage * 100.0) / 100.0)
                .sizingConstraint(base.getSizingConstraint())
                .dailyConsumptionUsed(base.getDailyConsumptionUsed())
                .build();
    }

    private SolarInstallation performCalculation(
            RoofCharacteristic roof,
            Equipment panel,
            Equipment inverter,
            Double dailyConsumptionKwh,
            Double quarterlyBillTnd) {
        double panelPowerW = (panel != null && panel.getNominalPower() != null)
                ? panel.getNominalPower() : DEFAULT_PANEL_POWER_W;
        double panelAreaM2 = (panel != null && panel.getArea() != null)
                ? panel.getArea() : DEFAULT_PANEL_AREA_M2;

        double usableArea = roof.getArea() * USABLE_SURFACE_COEFFICIENT;
        int panelCountRoof = (int) (usableArea / panelAreaM2);

        Double dailyUsed = resolveDailyConsumption(dailyConsumptionKwh, quarterlyBillTnd);
        int panelCountNeed = -1;
        String sizingConstraint = "ROOF";

        if (dailyUsed != null && panelCountRoof >= 1) {
            double yieldPerKwp = resolveYieldPerKwp(roof, panel);
            double targetKw = (dailyUsed * 365.0) / yieldPerKwp;
            panelCountNeed = (int) Math.ceil(targetKw * 1000.0 / panelPowerW);
            if (panelCountNeed < 1) {
                panelCountNeed = 1;
            }
            if (panelCountNeed < panelCountRoof) {
                sizingConstraint = "CONSUMPTION";
            } else if (panelCountNeed == panelCountRoof) {
                sizingConstraint = "BOTH_EQUAL";
            } else {
                sizingConstraint = "ROOF";
            }
        }

        int panelCount = panelCountRoof;
        if (panelCountNeed > 0) {
            panelCount = Math.min(panelCountRoof, panelCountNeed);
        }

        if (panelCount < 1) {
            return SolarInstallation.builder()
                    .panelCount(0)
                    .totalCapacityKw(0.0)
                    .estimatedAnnualProductionKwh(0.0)
                    .inverterModel("None")
                    .co2Savings(0.0)
                    .monthlySavings(0.0)
                    .sizingConstraint(sizingConstraint)
                    .dailyConsumptionUsed(dailyUsed)
                    .build();
        }

        double totalCapacityKw = (panelCount * panelPowerW) / 1000.0;
        double estimatedProduction = estimateAnnualProduction(roof, panel, totalCapacityKw);

        String finalInverterModel;
        if (inverter != null) {
            finalInverterModel = inverter.getModel();
        } else {
            finalInverterModel = totalCapacityKw < 3.0 ? "Micro-Inverter System" : "Central String Inverter 5kW";
            if (totalCapacityKw > 6.0) {
                finalInverterModel = "Three-Phase Hybrid Inverter 10kW";
            }
        }

        double annualSavings = estimatedProduction * ELECTRICITY_PRICE_TND_KWH;
        double panelPrice = (panel != null && panel.getPrice() != null) ? panel.getPrice().doubleValue() : 450.0;
        double inverterPrice = (inverter != null && inverter.getPrice() != null)
                ? inverter.getPrice().doubleValue() : 2500.0;
        double totalMaterialCost = (panelCount * panelPrice) + inverterPrice;
        double totalProjectCost = totalMaterialCost + (totalMaterialCost * INSTALLATION_LABOR_RATE);

        return SolarInstallation.builder()
                .panelCount(panelCount)
                .panelModel(panel != null ? panel.getModel() : "Default 400W Panel")
                .totalCapacityKw(Math.round(totalCapacityKw * 100.0) / 100.0)
                .estimatedCost(Math.round(totalProjectCost * 100.0) / 100.0)
                .estimatedAnnualProductionKwh(Math.round(estimatedProduction * 100.0) / 100.0)
                .inverterModel(finalInverterModel)
                .monthlySavings(Math.round((annualSavings / 12) * 100.0) / 100.0)
                .co2Savings(Math.round(estimatedProduction * CO2_FACTOR_KG_KWH * 100.0) / 100.0)
                .sizingConstraint(dailyUsed != null ? sizingConstraint : null)
                .dailyConsumptionUsed(dailyUsed != null
                        ? Math.round(dailyUsed * 100.0) / 100.0 : null)
                .build();
    }

    /**
     * Resolves daily kWh from direct input or quarterly STEG bill (same formula as public simulator).
     */
    private Double resolveDailyConsumption(Double dailyConsumptionKwh, Double quarterlyBillTnd) {
        if (dailyConsumptionKwh != null && dailyConsumptionKwh > 0) {
            return dailyConsumptionKwh;
        }
        if (quarterlyBillTnd != null && quarterlyBillTnd > 0) {
            double annualKwh = (quarterlyBillTnd * 4.0) / ELECTRICITY_PRICE_TND_KWH;
            return annualKwh / 365.0;
        }
        return null;
    }

    /** Site-specific yield for 1 kWp (kWh/kWp/year), used to translate consumption into target power. */
    private double resolveYieldPerKwp(RoofCharacteristic roof, Equipment panel) {
        double yield = estimateAnnualProduction(roof, panel, 1.0);
        return yield > 0 ? yield : AVERAGE_IRRADIANCE;
    }

    private double estimateAnnualProduction(RoofCharacteristic roof, Equipment panel, double totalCapacityKw) {
        double estimatedProduction;
        if (roof.getLatitude() != null && roof.getLongitude() != null) {
            double aspect = convertOrientationToDegrees(roof.getOrientation());
            double pvgisProduction = pvgisClient.getAnnualProduction(
                    roof.getLatitude(),
                    roof.getLongitude(),
                    totalCapacityKw,
                    roof.getInclination(),
                    aspect);
            if (pvgisProduction > 0) {
                estimatedProduction = pvgisProduction;
                log.info("Calculated production using PVGIS for {} kWp: {} kWh",
                        totalCapacityKw, estimatedProduction);
            } else {
                log.warn("PVGIS failed, falling back to static calculation");
                estimatedProduction = calculateStaticProduction(roof, totalCapacityKw);
            }
        } else {
            estimatedProduction = calculateStaticProduction(roof, totalCapacityKw);
        }

        double productionFactor = 1.0;
        if (panel != null && panel.getPanelCategory() != null) {
            productionFactor = panel.getPanelCategory().getProductionFactor();
        }
        return estimatedProduction * productionFactor;
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

    @Transactional(readOnly = true)
    public List<DimensioningResponse> getDimensioningByProjectId(Long projectId) {
        return dimensioningRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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
        d.setInstallerRecommendationJson(serializeRecommendation(rag.recommendation()));
        Dimensioning saved = dimensioningRepository.save(d);

        return mapToResponse(saved);
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
                .panel(toEquipmentSummary(d.getPanel()))
                .inverter(toEquipmentSummary(d.getInverter()))
                .financials(financialService.calculateMetrics(d.getSolarInstallation()))
                .installerRecommendation(deserializeRecommendation(d.getInstallerRecommendationJson()))
                .createdAt(d.getCreatedAt())
                .build();
    }

    private String serializeRecommendation(InstallerRecommendationDto recommendation) {
        if (recommendation == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(recommendation);
        } catch (JsonProcessingException e) {
            log.warn("Could not serialize installer recommendation: {}", e.getMessage());
            return null;
        }
    }

    private InstallerRecommendationDto deserializeRecommendation(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, InstallerRecommendationDto.class);
        } catch (JsonProcessingException e) {
            log.warn("Could not deserialize installer recommendation: {}", e.getMessage());
            return null;
        }
    }

    private EquipmentSummaryDto toEquipmentSummary(Equipment equipment) {
        if (equipment == null) {
            return null;
        }
        return EquipmentSummaryDto.builder()
                .id(equipment.getId())
                .name(equipment.getName())
                .brand(equipment.getBrand())
                .model(equipment.getModel())
                .equipmentType(equipment.getType() != null ? equipment.getType().name() : null)
                .panelCategory(equipment.getPanelCategory() != null
                        ? equipment.getPanelCategory().name() : null)
                .nominalPower(equipment.getNominalPower())
                .price(equipment.getPrice() != null ? equipment.getPrice().doubleValue() : null)
                .build();
    }
}
