package com.solarease.entity;

import com.solarease.enums.InstallationPhase;
import com.solarease.enums.InstallerFieldStatus;
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

    @Column(columnDefinition = "TEXT")
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

    @Column(name = "installer_email")
    private String installerEmail;

    @Column(name = "assigned_by_admin_id")
    private String assignedByAdminId;

    @Column(name = "assigned_by_admin_email")
    private String assignedByAdminEmail;

    @Column(name = "current_progress")
    private Integer currentProgress;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_field_status")
    private InstallerFieldStatus currentFieldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_phase")
    private InstallationPhase currentPhase;
    
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
