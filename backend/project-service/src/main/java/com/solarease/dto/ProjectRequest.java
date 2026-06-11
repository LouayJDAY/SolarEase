package com.solarease.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequest {
    
    @NotBlank(message = "Project name is required")
    private String name;
    
    private String description;
    
    private String location;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    @PositiveOrZero(message = "Peak power must be zero or positive")
    private Double peakPower;

    @PositiveOrZero(message = "Available area must be zero or positive")
    private Double availableArea;

    @DecimalMin(value = "0.0", message = "Inclination must be between 0 and 90")
    @DecimalMax(value = "90.0", message = "Inclination must be between 0 and 90")
    private Double inclination;

    @DecimalMin(value = "0.0", message = "Orientation must be between 0 and 360")
    @DecimalMax(value = "360.0", message = "Orientation must be between 0 and 360")
    private Double orientation;

    @PositiveOrZero(message = "Budget must be zero or positive")
    private Double budget;
    
    @NotNull(message = "Client ID is required")
    private Long clientId;

    private String installerId;
    private String installerEmail;
}
