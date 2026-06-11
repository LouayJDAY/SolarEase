package com.solarease.invoice;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class InvoiceServiceStegTest {

    private final InvoiceService service = new InvoiceService();

    @Test
    void extractsElectricityTotalFromStegConsumptionLine() {
        String ocr = """
                steg.com.tn
                28520 328 0 FACTURE
                CONSOMMATION & SERVICES
                Electricité 84323 84935 612 118,912
                Gaz 3158 3210 52 15,012
                MONTANT TOTAL 203,809
                Montant à payer 249,000
                """;

        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);

        assertEquals("STEG", dto.supplierName);
        assertEquals("28520 328 0", dto.invoiceNumber);
        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
        assertEquals("TND", dto.currency);
    }

    @Test
    void ignoresGasLineWhenExtractingElectricityTotal() {
        String ocr = """
                @steg.com.tn
                Gaz 3158 3210 52 15,012
                Electricité 612 118,912
                """;

        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);

        assertNotNull(dto.totalTTC);
        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
    }

    @Test
    void doesNotUseGlobalAmountToPayForSteg() {
        String ocr = """
                steg.com.tn
                Electricité 118,912
                Montant à payer 249,000
                """;

        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);

        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
    }

    @Test
    void returnsNullElectricityWhenOnlyGlobalTotalIsReadable() {
        String ocr = """
                steg.com.tn
                MONTANT TOTAL 203,809
                Montant à payer 249,000
                """;

        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);

        assertNull(dto.totalTTC);
        assertEquals("STEG", dto.supplierName);
    }
}
