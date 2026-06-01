package com.solarease.dto;

import com.solarease.enums.BlockageImpact;
import com.solarease.enums.BlockageType;
import com.solarease.enums.InstallerFieldStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldUpdateCreateRequest {

    @NotNull(message = "fieldStatus is required")
    private InstallerFieldStatus fieldStatus;

    /**
     * Manual progress override. Optional when {@link #completedSteps} is provided —
     * the server then computes the percentage from the checklist.
     */
    @Min(0)
    @Max(100)
    private Integer progressPercent;

    private String note;

    private Boolean isBlockage = false;

    private String blockageReason;

    private Boolean requiresAdminValidation = false;

    /** Keys of {@code InstallationPhase} ticked by the installer. */
    private List<String> completedSteps;

    private BlockageType blockageType;

    private BlockageImpact blockageImpact;

    /** Optional inline photo (data-URL or external URL, MVP without S3). */
    private String photoUrl;
}
