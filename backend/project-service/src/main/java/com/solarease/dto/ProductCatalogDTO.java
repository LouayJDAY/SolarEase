package com.solarease.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductCatalogDTO {
    private Long id;
    private String name;
    private String reference;
    private BigDecimal defaultPrice;
    private String category;
    private String description;
}
