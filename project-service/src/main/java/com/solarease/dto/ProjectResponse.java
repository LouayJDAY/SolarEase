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
    private ProjectStatus status;
    private Long clientId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
