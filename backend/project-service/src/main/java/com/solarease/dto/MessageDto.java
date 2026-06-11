package com.solarease.dto;

import jakarta.validation.constraints.Size;
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

    @Size(max = 5000, message = "Message must be at most 5000 characters")
    private String content;

    private Instant timestamp;

    private String attachmentFileName;
    private String attachmentOriginalName;
    private String attachmentContentType;
    private Long attachmentSizeBytes;
    private String attachmentUrl;
}
