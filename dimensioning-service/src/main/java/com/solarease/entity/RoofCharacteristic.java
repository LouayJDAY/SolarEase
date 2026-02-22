package com.solarease.entity;

import com.solarease.enums.Orientation;
import com.solarease.enums.RoofType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "roof_characteristics")
public class RoofCharacteristic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double area; // Surface disponible en m2
    
    private Double inclination; // Inclinaison en degrés (ex: 30°)
    
    @Enumerated(EnumType.STRING)
    private Orientation orientation; // Orientation (SUD, EST...)
    
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    private RoofType type; // Type de toit

    @OneToOne(mappedBy = "roofCharacteristic")
    private Dimensioning dimensioning;
}
