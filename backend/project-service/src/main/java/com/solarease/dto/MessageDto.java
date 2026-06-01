package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageDto {
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private List<String> recipientRoles;
    private String content;
    private Instant timestamp;
}
