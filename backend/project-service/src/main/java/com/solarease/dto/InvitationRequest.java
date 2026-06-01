package com.solarease.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvitationRequest {
    
    @NotNull(message = "Demand ID is required")
    private Long demandId;
    
    private Long projectId;   // nullable — invitation can be sent before a project is created
    
    @Email(message = "Invalid email format")
    private String clientEmail;
    
    private String clientName;
    
    private String phoneNumber;
    
    private String message;
    
    @NotNull(message = "Must specify send channels")
    private Boolean sendEmail;
    
    @NotNull(message = "Must specify send channels")
    private Boolean sendSms;
}
