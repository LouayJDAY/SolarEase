package com.solarease.entity;

import com.solarease.enums.DimensioningStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "dimensionings")
public class Dimensioning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long projectId; // Lien avec Project-Service

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "roof_id", referencedColumnName = "id")
    private RoofCharacteristic roofCharacteristic;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "installation_id", referencedColumnName = "id")
    private SolarInstallation solarInstallation;

    @Enumerated(EnumType.STRING)
    private DimensioningStatus status;

    @Column(columnDefinition = "TEXT")
    private String aiRecommendation;

    @ManyToOne
    @JoinColumn(name = "panel_id")
    private Equipment panel;

    @ManyToOne
    @JoinColumn(name = "inverter_id")
    private Equipment inverter;

    @Column(length = 20)
    private String panelType; // "CLASSIC" or "NIGHT_PANEL"

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
