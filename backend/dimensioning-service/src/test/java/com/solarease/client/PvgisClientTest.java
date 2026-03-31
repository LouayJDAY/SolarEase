package com.solarease.client;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PvgisClientTest {

    @Test
    void getAnnualProduction_ShouldReturnPositiveValue_ForTunis() {
        PvgisClient client = new PvgisClient();
        
        // Test with Tunis coordinates (36.8065° N, 10.1815° E)
        // 1 kWp system, 30° tilt, South (0°)
        double production = client.getAnnualProduction(36.8065, 10.1815, 1.0, 30.0, 0.0);
        
        System.out.println("PVGIS API Production for 1kWp in Tunis: " + production + " kWh/year");
        
        // Expecting something reasonable, e.g., > 1400 kWh/kWp/year
        assertTrue(production > 1000.0, "Production should be greater than 1000 kWh");
    }
    
    @Test
    void getAnnualProduction_ShouldReturnNegative_ForInvalidCoordinates() {
        PvgisClient client = new PvgisClient();
        // Impossible coordinates
        double production = client.getAnnualProduction(91.0, 0.0, 1.0, 30.0, 0.0);
        assertTrue(production < 0, "Production should be -1.0 for invalid input");
    }
}
