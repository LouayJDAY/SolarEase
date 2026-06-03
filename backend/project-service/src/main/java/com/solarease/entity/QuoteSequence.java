package com.solarease.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quote_sequences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuoteSequence {

    @Id
    private Integer year;

    @Column(name = "last_number", nullable = false)
    private Integer lastNumber;
}
