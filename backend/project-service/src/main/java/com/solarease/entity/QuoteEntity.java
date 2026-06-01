package com.solarease.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "quotes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuoteEntity {

    public enum QuoteStatus {
        DRAFT,      // Devis en brouillon
        SENT,       // Devis envoyé au client
        ACCEPTED,   // Devis accepté par client
        REJECTED,   // Devis rejeté par client
        EXPIRED,    // Devis expiré (après 30 jours)
        INVOICED    // Facture générée à partir du devis
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String quoteNumber; // e.g., "QUOTE-2026-001"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private Long clientId; // ID of the project client entity

    @Column(nullable = false)
    private String installerId; // UUID of INSTALLER user

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuoteStatus status;

    @Column(columnDefinition = "TEXT")
    private String description; // Description of quoted services/materials

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal laborCost; // Main labor/installation cost

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal materialsCost; // Cost of solar panels, inverter, batteries, etc.

    @Column(precision = 10, scale = 2)
    private BigDecimal tax; // VAT or other taxes

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount; // Total = laborCost + materialsCost + tax

    @Column(nullable = false)
    private LocalDateTime validUntil; // Quote expires after this date (typically 30 days)

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime sentAt; // When quote was sent to client

    @Column
    private LocalDateTime acceptedAt; // When client accepted the quote

    @Column
    private LocalDateTime rejectedAt; // When client rejected the quote

    @Column(columnDefinition = "TEXT")
    private String rejectionReason; // Reason for rejection (optional)

    @Column(columnDefinition = "TEXT")
    private String notes; // Internal notes from installer

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = QuoteStatus.DRAFT;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
