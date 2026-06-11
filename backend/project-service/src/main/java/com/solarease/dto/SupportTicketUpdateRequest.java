package com.solarease.dto;

import com.solarease.enums.SupportTicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SupportTicketUpdateRequest {
    @NotNull
    private SupportTicketStatus status;
}
