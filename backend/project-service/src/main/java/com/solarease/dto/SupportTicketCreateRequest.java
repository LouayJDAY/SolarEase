package com.solarease.dto;

import com.solarease.enums.SupportTicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketCreateRequest {

    @NotBlank
    @Size(max = 255)
    private String subject;

    @NotBlank
    @Size(max = 5000)
    private String description;

    private SupportTicketPriority priority;
}
