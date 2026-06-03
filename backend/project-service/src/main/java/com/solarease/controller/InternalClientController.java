package com.solarease.controller;

import com.solarease.dto.LinkAccountRequest;
import com.solarease.service.ClientAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.springframework.http.HttpStatus.FORBIDDEN;

@RestController
@RequestMapping("/api/internal/clients")
@RequiredArgsConstructor
public class InternalClientController {

    private final ClientAccountService clientAccountService;

    @Value("${solarease.n8n.internal-secret:change_me_n8n_secret}")
    private String internalSecret;

    @PostMapping("/link-account")
    @ResponseStatus(HttpStatus.OK)
    public Map<String, String> linkAccount(
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret,
            @Valid @RequestBody LinkAccountRequest request) {
        if (secret == null || !secret.equals(internalSecret)) {
            throw new ResponseStatusException(FORBIDDEN, "Invalid internal secret");
        }
        clientAccountService.linkAccount(request);
        return Map.of("success", "true", "message", "Client account linked");
    }
}
