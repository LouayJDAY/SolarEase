package com.solarease.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.solarease.dto.DimensioningRequest;
import com.solarease.dto.DimensioningResponse;
import com.solarease.entity.SolarInstallation;
import com.solarease.enums.Orientation;
import com.solarease.enums.RoofType;
import com.solarease.service.DimensioningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DimensioningController.class)
class DimensioningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DimensioningService dimensioningService;

    @Autowired
    private ObjectMapper objectMapper;

    private DimensioningRequest request;
    private DimensioningResponse response;

    @BeforeEach
    void setUp() {
        request = new DimensioningRequest();
        request.setProjectId(1L);
        request.setArea(50.0);
        request.setInclination(30.0);
        request.setOrientation(Orientation.SOUTH);
        request.setRoofType(RoofType.FLAT);
        request.setLatitude(36.8);
        request.setLongitude(10.18);

        SolarInstallation installation = SolarInstallation.builder()
                .panelCount(10)
                .totalCapacityKw(4.0)
                .estimatedAnnualProductionKwh(6000.0)
                .build();

        response = DimensioningResponse.builder()
                .id(1L)
                .projectId(1L)
                .installation(installation)
                .build();
    }

    @Test
    void calculate_ShouldReturnCreated_WhenRequestIsValid() throws Exception {
        when(dimensioningService.calculateDimensioning(any(DimensioningRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/dimensioning/calculate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.projectId").value(1L))
                .andExpect(jsonPath("$.installation.panelCount").value(10));
    }

    @Test
    void getByProject_ShouldReturnList_WhenExists() throws Exception {
        when(dimensioningService.getDimensioningByProjectId(anyLong()))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/dimensioning/project/{projectId}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void getById_ShouldReturnResponse_WhenExists() throws Exception {
        when(dimensioningService.getDimensioningById(anyLong())).thenReturn(response);

        mockMvc.perform(get("/api/dimensioning/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }
}
