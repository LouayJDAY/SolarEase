package com.solarease.dto;

import lombok.Data;

@Data
public class LinkAccountRequest {
    private String userId;
    private String email;
    private String invitationToken;
}
