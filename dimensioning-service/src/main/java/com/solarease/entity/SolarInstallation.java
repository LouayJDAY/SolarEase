package com.solarease.entity;

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
    
    private Double totalCapacityKw; // Puissance totale (kWc)
    
    private Double estimatedAnnualProductionKwh; // Production annuelle (kWh)
    
    private String inverterModel; // Modèle d'onduleur suggéré
    
    private Double monthlySavings; // Économies mensuelles estimées
    
    private Double co2Savings; // Économies CO2 (kg/an)

    @OneToOne(mappedBy = "solarInstallation")
    private Dimensioning dimensioning;
}
