package com.solarease.dto;

import com.solarease.enums.DemandPriority;
import com.solarease.enums.DemandSource;
import com.solarease.enums.DemandStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemandDTO {
    private Long id;
    private String clientUserId;
    private String clientEmail;
    private String clientFirstName;
    private String clientLastName;
    private String clientPhone;
    private DemandStatus status;
    private DemandSource source;
    private DemandPriority priority;
    private String assignedAdminId;
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
    private String rejectionReason;
    private String adminNote;
    private Long projectId;
    /** True when client has no portal account yet. */
    private Boolean clientHasAccount;
    private Boolean invitationSent;
    private LocalDateTime invitationSentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
