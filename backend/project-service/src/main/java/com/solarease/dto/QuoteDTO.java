package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteDTO {

    private Long id;
    private String quoteNumber;
    private Long projectId;
    private String projectName;
    private Long clientId;
    private String clientFirstName;
    private String clientLastName;
    private String installerId;
    private String status; // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, INVOICED
    private String description;
    private BigDecimal laborCost;
    private BigDecimal materialsCost;
    private BigDecimal tax;
    private BigDecimal totalAmount;
    private LocalDateTime validUntil;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime sentAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private String notes;
}
