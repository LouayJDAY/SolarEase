package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    private long totalProjects;
    private long totalClients;
    private long projectsCreated;
    private long projectsInProgress;
    private long projectsCompleted;
    private long projectsCancelled;

    /** Demands in status NOUVELLE (admin-facing only — installer-scoped views leave it at 0). */
    private long pendingDemandsCount;

    /** Demands created since today 00:00 (admin-facing only). */
    private long newDemandsTodayCount;
}
