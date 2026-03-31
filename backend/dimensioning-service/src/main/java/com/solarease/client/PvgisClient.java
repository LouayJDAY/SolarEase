package com.solarease.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@Slf4j
public class PvgisClient {

    private final RestTemplate restTemplate;
    private static final String PVGIS_API_URL = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc";

    public PvgisClient() {
        this.restTemplate = new RestTemplate();
    }

    public double getAnnualProduction(double lat, double lon, double peakPowerKw, double angle, double aspect) {
        // PVGIS expects aspect: 0=South, -90=East, 90=West. 
        // Our enum might differ, need to handle that mapping in Service.
        
        String url = UriComponentsBuilder.fromHttpUrl(PVGIS_API_URL)
                .queryParam("lat", lat)
                .queryParam("lon", lon)
                .queryParam("peakpower", peakPowerKw)
                .queryParam("loss", 14) // Standard system loss
                .queryParam("angle", angle)
                .queryParam("aspect", aspect)
                .queryParam("outputformat", "json")
                .toUriString();

        try {
            log.info("Calling PVGIS API: {}", url);
            PvgisResponse response = restTemplate.getForObject(url, PvgisResponse.class);
            
            if (response != null && response.outputs != null 
                    && response.outputs.totals != null 
                    && response.outputs.totals.fixed != null
                    && response.outputs.totals.fixed.E_y != null) {
                return response.outputs.totals.fixed.E_y;
            } else {
                log.warn("PVGIS returned null production data. Response: {}", response);
            }
        } catch (Exception e) {
            log.error("Failed to call PVGIS API", e);
        }
        
        return -1.0; // Indicate failure
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PvgisResponse {
        public Outputs outputs;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Outputs {
        public Totals totals;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Totals {
        @com.fasterxml.jackson.annotation.JsonProperty("fixed")
        public Fixed fixed;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Fixed {
        @com.fasterxml.jackson.annotation.JsonProperty("E_y")
        public Double E_y; // Annual energy production [kWh]
    }
}
