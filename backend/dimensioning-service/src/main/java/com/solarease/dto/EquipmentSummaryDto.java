package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight equipment snapshot returned with dimensioning results.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentSummaryDto {

    private Long id;
    private String name;
    private String brand;
    private String model;
    private String equipmentType;
    private String panelCategory;
    private Double nominalPower;
    private Double price;
}
