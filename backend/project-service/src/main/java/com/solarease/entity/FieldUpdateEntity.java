package com.solarease.entity;

import com.solarease.enums.BlockageImpact;
import com.solarease.enums.BlockageType;
import com.solarease.enums.InstallationPhase;
import com.solarease.enums.InstallerFieldStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "field_updates",
        indexes = {
            @Index(name = "idx_field_updates_project_id", columnList = "project_id"),
            @Index(name = "idx_field_updates_installer_id", columnList = "installer_id")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldUpdateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "installer_id", nullable = false)
    private String installerId;

    @Column(name = "installer_email")
    private String installerEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_status", nullable = false)
    private InstallerFieldStatus fieldStatus;

    @Column(name = "progress_percent")
    private Integer progressPercent;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "is_blockage")
    private Boolean isBlockage;

    @Column(name = "blockage_reason", columnDefinition = "TEXT")
    private String blockageReason;

    @Column(name = "requires_admin_validation")
    private Boolean requiresAdminValidation;

    /** null = pending, true = validated, false = rejected */
    @Column(name = "admin_validated")
    private Boolean adminValidated;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "validated_by_admin_id")
    private String validatedByAdminId;

    @Column(name = "validated_by_admin_email")
    private String validatedByAdminEmail;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    /** JSON-encoded list of {@link InstallationPhase} keys cocked by the installer. */
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "completed_steps", columnDefinition = "TEXT")
    private List<String> completedSteps;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_phase")
    private InstallationPhase currentPhase;

    @Enumerated(EnumType.STRING)
    @Column(name = "blockage_type")
    private BlockageType blockageType;

    @Enumerated(EnumType.STRING)
    @Column(name = "blockage_impact")
    private BlockageImpact blockageImpact;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isBlockage == null) isBlockage = false;
        if (requiresAdminValidation == null) requiresAdminValidation = false;
        if (progressPercent == null) progressPercent = 0;
    }
}
