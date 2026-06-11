package com.solarease.dto;

import com.solarease.enums.Orientation;
import com.solarease.enums.RoofType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
    @Min(value = 0, message = "Inclination must be between 0 and 90")
    @Max(value = 90, message = "Inclination must be between 0 and 90")
    private Double inclination;

    @NotNull(message = "Orientation is required")
    private Orientation orientation;
    
    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private Double latitude;
    
    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private Double longitude;

    @NotNull(message = "Roof type is required")
    private RoofType roofType;

    private Long panelId;
    private Long inverterId;

    // ── Night Panel support ──
    private String panelType; // TOPCON_N_TYPE, BIFACIAL, GLASS_GLASS (default: TOPCON_N_TYPE)
    private Long nightPanelId;

    @Positive(message = "Daily consumption must be positive")
    private Double dailyConsumptionKwh;

    @Positive(message = "Quarterly bill must be positive")
    private Double quarterlyBillTnd;
}
