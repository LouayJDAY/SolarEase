package com.solarease.dto;

import com.solarease.enums.EquipmentType;
import com.solarease.enums.PanelCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentRequest {

    @NotBlank(message = "Equipment name is required")
    @Size(max = 200, message = "Name must be at most 200 characters")
    private String name;

    @NotNull(message = "Equipment type is required")
    private EquipmentType type;

    @Size(max = 100)
    private String brand;

    @Size(max = 100)
    private String model;

    private PanelCategory panelCategory;

    @Positive(message = "Nominal power must be positive")
    private Double nominalPower;

    @Positive(message = "Efficiency must be positive")
    private Double efficiency;

    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @Positive(message = "Warranty years must be positive")
    private Integer warrantyYears;

    @Positive(message = "Area must be positive")
    private Double area;

    @Positive(message = "Storage capacity must be positive")
    private Double storageCapacityKwh;

    private String specifications;
    private String imageUrl;
}
