package com.solarease.entity;

import com.solarease.enums.EquipmentType;
import com.solarease.enums.PanelCategory;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "equipments")
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String brand;
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentType type;

    /** TOPCon, bifacial ou biverre — uniquement pour SOLAR_PANEL. */
    @Enumerated(EnumType.STRING)
    @Column(name = "panel_category")
    private PanelCategory panelCategory;

    // Specific to Solar Panel / Inverter
    private Double nominalPower; // Watts (W)

    private Double voltage; // Volts (V)
    private Double efficiency; // 0.20 for 20%
    private Double area; // m2 (for physical dimensioning)

    private Double storageCapacityKwh; // kWh storage (for Night Panels)

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    private Integer warrantyYears;

    @Column(columnDefinition = "TEXT")
    private String specifications; // JSON string for extra fields

    private String imageUrl; // For the catalog display

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
