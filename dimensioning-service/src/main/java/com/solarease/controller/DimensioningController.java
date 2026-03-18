package com.solarease.controller;

import com.solarease.dto.DimensioningRequest;
import com.solarease.dto.DimensioningResponse;
import com.solarease.dto.ComparisonResponse;
import com.solarease.service.DimensioningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.ByteArrayInputStream;
import java.util.List;

@RestController
@RequestMapping("/api/dimensioning")
@RequiredArgsConstructor
public class DimensioningController {

    private final DimensioningService dimensioningService;

    @PostMapping("/calculate")
    @ResponseStatus(HttpStatus.CREATED)
    public DimensioningResponse calculate(@RequestBody @Valid DimensioningRequest request) {
        return dimensioningService.calculateDimensioning(request);
    }

    @PostMapping("/compare")
    @ResponseStatus(HttpStatus.OK)
    public ComparisonResponse compare(@RequestBody @Valid DimensioningRequest request) {
        return dimensioningService.compareDimensioning(request);
    }

    @GetMapping("/project/{projectId}")
    public List<DimensioningResponse> getByProject(@PathVariable Long projectId) {
        return dimensioningService.getDimensioningByProjectId(projectId);
    }

    @GetMapping("/{id}")
    public DimensioningResponse getById(@PathVariable Long id) {
        return dimensioningService.getDimensioningById(id);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id) {
        ByteArrayInputStream pdfStream = dimensioningService.getDimensioningPdfReport(id);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=dimensioning_" + id + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(pdfStream));
    }
}

