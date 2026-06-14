package com.solarease.controller;

import com.solarease.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@RestController
@RequestMapping("/api/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final AuthService authService;

    @Value("${solarease.internal.secret:change_me_n8n_secret}")
    private String internalSecret;

    @DeleteMapping("/client")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClientPortalAccount(
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret,
            @RequestParam(required = false) String uuid,
            @RequestParam(required = false) String email) {
        if (secret == null || !secret.equals(internalSecret)) {
            throw new ResponseStatusException(FORBIDDEN, "Invalid internal secret");
        }
        authService.deleteClientPortalAccount(uuid, email);
    }
}
