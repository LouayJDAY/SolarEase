package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientStatsResponse {

    private long totalClients;
    private long totalProjectsLinked;
    private long addedThisMonth;
}
