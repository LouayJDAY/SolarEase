package com.solarease.invoice;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class Repro249Test {

    private final InvoiceService service = new InvoiceService();

    @Test
    void repro249OnElectricHeaderLine() {
        String ocr = """
                steg.com.tn
                Societe Electricite et duGaz 249,000
                28520 328 0 FACTURE
                """;
        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);
        assertNull(dto.totalTTC);
    }

    @Test
    void repro249OnElectricRowWith118() {
        String ocr = """
                steg.com.tn
                Electricité 84323 84935 612 118,912
                249,000 ju sua
                """;
        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);
        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
    }

    @Test
    void repro249FallbackConsommationMultiAmount() {
        String ocr = """
                steg.com.tn
                CONSOMMATION & SERVICES 118,912 249,000
                """;
        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);
        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
    }

    @Test
    void detects448912MisreadAsElectricityTotal() {
        String ocr = """
                steg.com.tn
                28520 328 0 FACTURE
                448,912
                TOTAL GAZ
                249,000
                """;
        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);
        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
    }

    @Test
    void detects118812DotMisread() {
        String ocr = """
                steg.com.tn
                118.812
                """;
        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);
        assertEquals(new BigDecimal("118.812"), dto.totalTTC);
    }
}
