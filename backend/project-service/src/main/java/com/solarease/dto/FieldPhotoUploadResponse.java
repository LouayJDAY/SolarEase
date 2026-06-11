package com.solarease.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldPhotoUploadResponse {
    private String photoUrl;
    private String fileName;
}
