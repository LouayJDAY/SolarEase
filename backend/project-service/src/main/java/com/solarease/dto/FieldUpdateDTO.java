package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldUpdateDTO {

    private Long id;
    private Long projectId;
    private String installerId;
    private String installerEmail;
    private String fieldStatus;
    private Integer progressPercent;
    private String note;
    private Boolean isBlockage;
    private String blockageReason;
    private Boolean requiresAdminValidation;
    private Boolean adminValidated;
    private String adminNote;
    private String validatedByAdminId;
    private String validatedByAdminEmail;
    private LocalDateTime validatedAt;
    private LocalDateTime createdAt;

    private List<String> completedSteps;
    private String currentPhase;
    private String currentPhaseLabel;
    private String blockageType;
    private String blockageTypeLabel;
    private String blockageImpact;
    private String blockageImpactLabel;
    private String photoUrl;
}
