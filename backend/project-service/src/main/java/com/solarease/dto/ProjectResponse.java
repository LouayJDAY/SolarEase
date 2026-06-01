package com.solarease.dto;

import com.solarease.enums.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    
    private Long id;
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
    private ProjectStatus status;
    private Long clientId;
    private String installerId;
    private String installerEmail;
    private String assignedByAdminId;
    private String assignedByAdminEmail;
    private Integer currentProgress;
    private String currentFieldStatus;
    private String currentPhase;
    private String currentPhaseLabel;
    private ClientInfo client;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientInfo {
        private Long id;
        private String firstName;
        private String lastName;
    }
}
