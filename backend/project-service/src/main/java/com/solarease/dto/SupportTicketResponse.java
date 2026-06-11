package com.solarease.dto;

import com.solarease.enums.SupportTicketPriority;
import com.solarease.enums.SupportTicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketResponse {
    private Long id;
    private String clientUserId;
    private String clientName;
    private String clientEmail;
    private String subject;
    private String description;
    private SupportTicketStatus status;
    private SupportTicketPriority priority;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
}
