package com.solarease.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LinkAccountRequest {

    @NotBlank
    private String userId;

    @Email
    @NotBlank
    private String email;

    private String invitationToken;
}
