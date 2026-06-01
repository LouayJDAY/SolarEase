package com.solarease.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateInstallerRequest {

    private String firstName;

    private String lastName;

    @Email(message = "Email invalide")
    private String email;

    private String phone;

    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caracteres")
    private String password;

    private Boolean isActive;
}
