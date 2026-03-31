package com.solarease.service;

import com.solarease.dto.DimensioningRequest;
import com.solarease.dto.DimensioningResponse;
import com.solarease.entity.Dimensioning;
import com.solarease.entity.RoofCharacteristic;
import com.solarease.entity.SolarInstallation;
import com.solarease.enums.DimensioningStatus;
import com.solarease.enums.Orientation;
import com.solarease.enums.RoofType;
import com.solarease.repository.DimensioningRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DimensioningServiceTest {

    @Mock
    private DimensioningRepository dimensioningRepository;

    @InjectMocks
    private DimensioningService dimensioningService;

    private DimensioningRequest request;

    @BeforeEach
    void setUp() {
        request = new DimensioningRequest();
        request.setProjectId(1L);
        request.setArea(50.0);
        request.setInclination(30.0);
        request.setOrientation(Orientation.SOUTH);
        request.setRoofType(RoofType.FLAT);
    }

    @Test
    void calculate_ShouldReturnValidResponse_WhenInputIsCorrect() {
        // Arrange
        when(dimensioningRepository.save(any(Dimensioning.class))).thenAnswer(invocation -> {
            Dimensioning d = invocation.getArgument(0);
            d.setId(1L);
            d.setCreatedAt(LocalDateTime.now());
            // The service calculates BEFORE save, so 'd' already has installation
            return d;
        });

        // Act
        DimensioningResponse response = dimensioningService.calculateDimensioning(request);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getInstallation());
        assertTrue(response.getInstallation().getPanelCount() > 0);
        assertTrue(response.getInstallation().getTotalCapacityKw() > 0);
        verify(dimensioningRepository, times(1)).save(any(Dimensioning.class));
    }

    @Test
    void calculate_ShouldAccountForOrientationEfficiency() {
        // Arrange
        DimensioningRequest southRequest = new DimensioningRequest();
        southRequest.setProjectId(1L);
        southRequest.setArea(50.0);
        southRequest.setInclination(30.0);
        southRequest.setOrientation(Orientation.SOUTH); // Best
        southRequest.setRoofType(RoofType.FLAT);

        DimensioningRequest northRequest = new DimensioningRequest();
        northRequest.setProjectId(2L);
        northRequest.setArea(50.0);
        northRequest.setInclination(30.0);
        northRequest.setOrientation(Orientation.NORTH); // Less efficient
        northRequest.setRoofType(RoofType.FLAT);

        // We capture arguments or just rely on the return value which is mapped from the saved entity
        when(dimensioningRepository.save(any(Dimensioning.class))).thenAnswer(i -> {
             Dimensioning d = i.getArgument(0);
             d.setId(100L);
             return d;
        });

        // Act
        DimensioningResponse southResponse = dimensioningService.calculateDimensioning(southRequest);
        DimensioningResponse northResponse = dimensioningService.calculateDimensioning(northRequest);

        // Assert
        assertNotNull(southResponse.getInstallation());
        assertNotNull(northResponse.getInstallation());
        
        // South facing should generally produce MORE than North facing
        // North orientation factor is 0.6, South is 1.0
        assertTrue(southResponse.getInstallation().getEstimatedAnnualProductionKwh() > 
                   northResponse.getInstallation().getEstimatedAnnualProductionKwh(),
                   "South facing should have higher production");
    }

    @Test
    void getDimensioningByProject_ShouldReturnResult_WhenExists() {
        // Arrange
        Dimensioning dimensioning = new Dimensioning();
        dimensioning.setId(1L);
        dimensioning.setProjectId(1L);
        dimensioning.setStatus(DimensioningStatus.COMPLETED);
        
        when(dimensioningRepository.findByProjectId(1L)).thenReturn(Collections.singletonList(dimensioning));

        // Act
        List<DimensioningResponse> result = dimensioningService.getDimensioningByProjectId(1L);

        // Assert
        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1L, result.get(0).getProjectId());
    }

    @Test
    void getDimensioningById_ShouldThrowException_WhenNotFound() {
        // Arrange
        when(dimensioningRepository.findById(99L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> dimensioningService.getDimensioningById(99L));
    }
}
