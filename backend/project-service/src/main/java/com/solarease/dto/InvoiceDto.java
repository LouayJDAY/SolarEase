package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvoiceDto {
    private String id;
    private String number;
    private LocalDate date;
    private LocalDate dueDate;
    private double amount;
    private Double subtotal;
    private Double discountPercent;
    private Double discountAmount;
    private String status;
    private String notes;
}
