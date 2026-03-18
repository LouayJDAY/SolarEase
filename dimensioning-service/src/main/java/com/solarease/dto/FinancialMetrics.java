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
public class FinancialMetrics {
    private Double totalInvestmentCost; // Coût total de l'installation (TND)
    private Double annualSavings; // Économies annuelles moyennes (TND)
    private Double roiPercentage; // Retour sur Investissement (%)
    private Double paybackPeriodYears; // Temps de retour sur investissement (années)
    private Double netSavings25Years; // Économies nettes cumulées sur 25 ans (TND)
    private List<Double> cumulativeCashFlow; // Flux de trésorerie cumulé année par année (pour le graphique)
}
