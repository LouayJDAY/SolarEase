package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentDto {
    private String id;
    private String name;
    private String type;
    private String status;
    private String size;
    private LocalDate date;
    private String url;
}
