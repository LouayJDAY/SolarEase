package com.solarease.entity;

import com.solarease.enums.ProjectStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;
    
    private String location;

    private Double latitude;
    private Double longitude;
    private Double peakPower;       // kWc
    private Double availableArea;   // m²
    private Double inclination;     // degrees
    private Double orientation;     // degrees
    private Double budget;          // TND

    @Enumerated(EnumType.STRING)
    private ProjectStatus status;

    @Column(name = "client_id")
    private Long clientId;

    @Column(name = "installer_id")
    private String installerId;
    
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ProjectStatus.CREATED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
