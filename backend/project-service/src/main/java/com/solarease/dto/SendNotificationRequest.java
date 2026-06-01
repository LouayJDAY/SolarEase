package com.solarease.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendNotificationRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    /** "USER" — target an explicit userId, or "ROLE_IN_PROJECT" — target all actors of a given role on a project */
    @NotBlank
    private String targetType;

    /** Used when targetType = "USER" */
    private String targetUserId;

    /** Used when targetType = "ROLE_IN_PROJECT" */
    private Long projectId;

    /** "CLIENT", "INSTALLER", "ADMIN", or "ALL" — used when targetType = "ROLE_IN_PROJECT" */
    private String targetRole;
}
