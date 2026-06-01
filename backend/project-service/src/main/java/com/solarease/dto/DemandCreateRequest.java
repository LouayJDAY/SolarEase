package com.solarease.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DemandCreateRequest {

    @NotBlank(message = "Demand name is required")
    private String name;

    private String description;
    private String location;
    private Double latitude;
    private Double longitude;
    private Double peakPower;
    private Double availableArea;
    private Double inclination;
    private Double orientation;
    private Double budget;
}
