package com.solarease.service;

import com.solarease.dto.DimensioningResponse;
import com.solarease.entity.SolarInstallation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DecisionSupportServiceTest {

    @Mock
    private OllamaService ollamaService;

    @InjectMocks
    private DecisionSupportService decisionSupportService;

    private DimensioningResponse dimensioningResponse;

    @BeforeEach
    void setUp() {
        SolarInstallation installation = SolarInstallation.builder()
                .totalCapacityKw(5.0)
                .estimatedAnnualProductionKwh(8000.0)
                .monthlySavings(200.0)
                .build();

        dimensioningResponse = DimensioningResponse.builder()
                .installation(installation)
                .build();
    }

    @Test
    void whenGenerateAiRecommendation_thenCallsOllamaService() {
        // Arrange
        String expectedResponse = "Ollama response";
        when(ollamaService.generate(anyString())).thenReturn(expectedResponse);

        // Act
        String actualResponse = decisionSupportService.generateAiRecommendation(dimensioningResponse);

        // Assert
        assertEquals(expectedResponse, actualResponse);
        verify(ollamaService).generate(contains("Puissance: 5.00 kWc"));
        verify(ollamaService).generate(contains("Production estimée: 8000.00 kWh/an"));
    }

    @Test
    void whenInstallationIsNull_thenReturnsDefaultMessage() {
        // Arrange
        DimensioningResponse emptyResponse = DimensioningResponse.builder().build();

        // Act
        String actualResponse = decisionSupportService.generateAiRecommendation(emptyResponse);

        // Assert
        assertEquals("Aucune installation calculée.", actualResponse);
    }
}
