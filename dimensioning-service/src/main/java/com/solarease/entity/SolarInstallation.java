package com.solarease.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "solar_installations")
public class SolarInstallation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer panelCount; // Nombre de panneaux

    private String panelModel; // Modèle de panneau utilisé
    
    private Double totalCapacityKw; // Puissance totale (kWc)

    private Double estimatedCost; // Coût estimé (TND)

    private Double estimatedAnnualProductionKwh; // Production annuelle (kWh)
    
    private String inverterModel; // Modèle d'onduleur suggéré
    
    private Double monthlySavings; // Économies mensuelles estimées
    
    private Double co2Savings; // Économies CO2 (kg/an)

    // ── Night Panel fields ──
    private Boolean isNightPanel; // true si dimensionnement Night Panel

    private Double storageCapacityKwh; // Capacité de stockage intégrée (kWh)

    private Double selfConsumptionRate; // Taux d'autoconsommation (0.0 - 1.0)

    private Double nightCoverageRate; // Taux de couverture nocturne (0.0 - 1.0)

    private Double dailyProductionKwh; // Production diurne moyenne (kWh/jour)

    private Double nightlyConsumptionKwh; // Consommation nocturne couverte (kWh/jour)

    @JsonIgnore
    @OneToOne(mappedBy = "solarInstallation")
    private Dimensioning dimensioning;
}
