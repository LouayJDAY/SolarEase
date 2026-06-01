package com.solarease.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserDto user;
    private String message;
    private String email;
    private String otpCode;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserDto {
        private Long id;
        private String uuid;
        private String email;
        private String username;
        private String firstName;
        private String lastName;
        private String phone;
        private String role;
        private Boolean isEmailVerified;
        private Boolean isActive;
        private LocalDateTime createdAt;
    }
}
