package com.solarease.controller;

import com.solarease.dto.DimensioningRequest;
import com.solarease.dto.DimensioningResponse;
import com.solarease.service.DimensioningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/project/{projectId}")
    public List<DimensioningResponse> getByProject(@PathVariable Long projectId) {
        return dimensioningService.getDimensioningByProjectId(projectId);
    }

    @GetMapping("/{id}")
    public DimensioningResponse getById(@PathVariable Long id) {
        return dimensioningService.getDimensioningById(id);
    }
}
