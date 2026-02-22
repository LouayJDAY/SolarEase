package com.solarease.dto;

import com.solarease.enums.Orientation;
import com.solarease.enums.RoofType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DimensioningRequest {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Area is required")
    @Positive(message = "Area must be positive")
    private Double area;

    @NotNull(message = "Inclination is required")
    private Double inclination;

    @NotNull(message = "Orientation is required")
    private Orientation orientation;
    
    @NotNull(message = "Latitude is required")
    private Double latitude;
    
    @NotNull(message = "Longitude is required")
    private Double longitude;

    @NotNull(message = "Roof type is required")
    private RoofType roofType;
}
