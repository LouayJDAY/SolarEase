package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotePublicResponse {
    private ProjectResponse project;
    private boolean invitationSent;
    private String invitationMessage;
}
