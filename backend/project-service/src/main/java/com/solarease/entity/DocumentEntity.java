package com.solarease.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DocumentEntity {

    public enum DocumentType {
        DEVIS,           // Quote/Proposal
        FACTURE,         // Invoice
        CONTRAT,         // Contract
        CERTIFICAT,      // Certificate (compliance, energy, etc.)
        RAPPORT,         // Report (installation, inspection, etc.)
        GARANTIE,        // Warranty document
        ASSURANCE,       // Insurance document
        AUTRE            // Other
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Document filename

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project; // LINKED TO PROJECT (NEW)

    @Column(nullable = false)
    private String clientId; // UUID of client

    @Column(nullable = false)
    private String installerId; // UUID of installer (NEW)

    @Column(nullable = false)
    private String url; // S3 URL or storage path

    @Column(nullable = false)
    private String size; // File size (e.g., "2.5 MB")

    @Column(nullable = false)
    private LocalDate date; // Document creation date

    @Column(nullable = false)
    private Integer version; // Version number (for documents that have multiple versions)

    @Column
    private LocalDateTime uploadedAt; // When document was uploaded

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column
    private String createdBy; // User ID who created/uploaded document

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.uploadedAt = LocalDateTime.now();
        if (this.version == null) {
            this.version = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
