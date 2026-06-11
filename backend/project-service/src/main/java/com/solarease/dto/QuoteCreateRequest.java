package com.solarease.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteCreateRequest {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @Size(max = 2000)
    private String description;

    @NotNull(message = "Labor cost is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Labor cost must be non-negative")
    private BigDecimal laborCost;

    @NotNull(message = "Materials cost is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Materials cost must be non-negative")
    private BigDecimal materialsCost;

    @DecimalMin(value = "0.0", inclusive = true, message = "Tax must be non-negative")
    private BigDecimal tax;

    @Size(max = 2000)
    private String notes;
}
