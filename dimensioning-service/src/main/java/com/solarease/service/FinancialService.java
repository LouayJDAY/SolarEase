package com.solarease.service;

import com.solarease.dto.FinancialMetrics;
import com.solarease.entity.SolarInstallation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class FinancialService {

    private static final double ELECTRICITY_PRICE_TND_KWH = 0.280; // Prix moyen du kWh (STEG - Palier supérieur)
    private static final double ANNUAL_INFLATION_RATE = 0.05; // Hausse annuelle du prix de l'électricité (5%)
    private static final double PANEL_DEGRADATION_RATE = 0.005; // Perte de rendement annuelle (0.5%)

    public FinancialMetrics calculateMetrics(SolarInstallation installation) {
        if (installation == null || installation.getTotalCapacityKw() == null) {
            return new FinancialMetrics();
        }

        // 1. Initial Investment (CAPEX)
        // Use real estimated cost if available, else fallback to generic per kW cost
        double initialInvestment;
        if (installation.getEstimatedCost() != null && installation.getEstimatedCost() > 0) {
            initialInvestment = installation.getEstimatedCost();
        } else {
            initialInvestment = installation.getTotalCapacityKw() * 3500.0; // Fallback
        }
        
        // 2. Cash Flow Simulation (25 Years)
        List<Double> cashFlow = new ArrayList<>();
        double cumulativeCashFlowValue = -initialInvestment;
        cashFlow.add(cumulativeCashFlowValue); // Year 0

        double currentProduction = installation.getEstimatedAnnualProductionKwh();
        double currentElectricityPrice = ELECTRICITY_PRICE_TND_KWH;
        
        double paybackYear = -1.0;
        
        for (int year = 1; year <= 25; year++) {
            // Calculate savings for the year
            double yearSavings = currentProduction * currentElectricityPrice;
            
            // Update cumulative cash flow
            cumulativeCashFlowValue += yearSavings;
            cashFlow.add(Math.round(cumulativeCashFlowValue * 100.0) / 100.0);

            // Detect payback period (when cash flow becomes positive)
            if (paybackYear == -1.0 && cumulativeCashFlowValue >= 0) {
                // Linear interpolation for more precision
                double previousCashFlow = cashFlow.get(year - 1);
                double fraction = Math.abs(previousCashFlow) / yearSavings;
                paybackYear = (year - 1) + fraction;
            }

            // Apply degradation and inflation for next year
            currentProduction *= (1 - PANEL_DEGRADATION_RATE);
            currentElectricityPrice *= (1 + ANNUAL_INFLATION_RATE);
        }

        double totalNetSavings = cumulativeCashFlowValue; // At year 25
        double avgAnnualSavings = (totalNetSavings + initialInvestment) / 25;
        double roi = (totalNetSavings / initialInvestment) * 100;

        return FinancialMetrics.builder()
                .totalInvestmentCost(Math.round(initialInvestment * 100.0) / 100.0)
                .annualSavings(Math.round(avgAnnualSavings * 100.0) / 100.0)
                .roiPercentage(Math.round(roi * 100.0) / 100.0)
                .paybackPeriodYears(paybackYear > 0 ? Math.round(paybackYear * 10.0) / 10.0 : 25.0)
                .netSavings25Years(Math.round(totalNetSavings * 100.0) / 100.0)
                .cumulativeCashFlow(cashFlow)
                .build();
    }
}
