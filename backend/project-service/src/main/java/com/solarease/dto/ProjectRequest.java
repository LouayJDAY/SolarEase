package com.solarease.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    private Double latitude;
    private Double longitude;
    private Double peakPower;
    private Double availableArea;
    private Double inclination;
    private Double orientation;
    private Double budget;
    
    @NotNull(message = "Client ID is required")
    private Long clientId;
}
