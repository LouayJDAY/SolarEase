package com.solarease.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String firstName;

    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String lastName;

    @Size(max = 20, message = "Le numéro de téléphone ne doit pas dépasser 20 caractères")
    private String phone;

    @Size(max = 100, message = "Le nom de l'entreprise ne doit pas dépasser 100 caractères")
    private String company;
}
