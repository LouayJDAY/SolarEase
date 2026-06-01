package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDto {
    private String id;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
