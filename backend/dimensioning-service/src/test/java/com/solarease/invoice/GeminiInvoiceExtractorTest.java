package com.solarease.invoice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class GeminiInvoiceExtractorTest {

    private final GeminiInvoiceExtractor extractor = new GeminiInvoiceExtractor(new RestTemplateBuilder(), 45);

    @Test
    void disabledWhenApiKeyEmpty() {
        assertFalse(extractor.isEnabled());
    }

    @Test
    void mapsGeminiJsonResponse() throws Exception {
        String apiResponse = """
                {
                  "candidates": [{
                    "content": {
                      "parts": [{
                        "text": "{\\"supplierName\\":\\"STEG\\",\\"invoiceNumber\\":\\"28520 328 0\\",\\"date\\":\\"31/12/2024\\",\\"totalElectricityTND\\":118.912,\\"currency\\":\\"TND\\"}"
                      }]
                    }
                  }]
                }
                """;

        InvoiceDTO dto = extractor.mapResponse(apiResponse);

        assertNotNull(dto);
        assertEquals("STEG", dto.supplierName);
        assertEquals("28520 328 0", dto.invoiceNumber);
        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
        assertEquals("TND", dto.currency);
    }

    @Test
    void returnsNullWhenAmountMissing() throws Exception {
        String apiResponse = """
                {
                  "candidates": [{
                    "content": {
                      "parts": [{
                        "text": "{\\"supplierName\\":\\"STEG\\",\\"invoiceNumber\\":null,\\"totalElectricityTND\\":null}"
                      }]
                    }
                  }]
                }
                """;

        assertNull(extractor.mapResponse(apiResponse));
    }
}
