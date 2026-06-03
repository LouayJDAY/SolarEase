package com.solarease.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {

    @Email(message = "Email invalide")
    private String email;

    @NotBlank(message = "OTP code requis")
    private String otpCode;

    /** Optional invitation token from public demand email link. */
    private String invitationToken;
}
