package com.solarease.entity;

import com.solarease.enums.DemandPriority;
import com.solarease.enums.DemandSource;
import com.solarease.enums.DemandStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "demands")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The identity-service UUID of the CLIENT who submitted the demand */
    @Column(name = "client_user_id", nullable = false)
    private String clientUserId;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "client_first_name")
    private String clientFirstName;

    @Column(name = "client_last_name")
    private String clientLastName;

    @Column(name = "client_phone")
    private String clientPhone;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DemandStatus status = DemandStatus.NOUVELLE;

    /** Where the demand came from -- defaults to CLIENT for legacy rows. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DemandSource source = DemandSource.CLIENT;

    /** Admin triage knob. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DemandPriority priority = DemandPriority.NORMALE;

    /** Admin who self-assigned this demand (identity-service UUID), nullable. */
    @Column(name = "assigned_admin_id")
    private String assignedAdminId;

    // Solar project fields (same as Project)
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

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    /** Set once the admin converts this demand to a project */
    @Column(name = "project_id")
    private Long projectId;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = DemandStatus.NOUVELLE;
        }
        if (source == null) {
            source = DemandSource.CLIENT;
        }
        if (priority == null) {
            priority = DemandPriority.NORMALE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
