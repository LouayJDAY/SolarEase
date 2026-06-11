package com.solarease.invoice;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class InvoiceServiceFacture1OcrTest {

    private final InvoiceService service = new InvoiceService();

    @Test
    void parseFacture1ImageEndToEnd() throws Exception {
        assumeTrue(isTesseractAvailable(), "tesseract not installed locally");
        Path image = Path.of(System.getProperty("user.home"),
                ".cursor/projects/home-louay-Desktop-louay-Parnass/assets/facture1-9999a651-67df-47a3-929f-2550378f52b4.png");
        assumeTrue(Files.exists(image), "facture1 image missing");
        byte[] bytes = Files.readAllBytes(image);
        MockMultipartFile file = new MockMultipartFile("file", "facture1.png", "image/png", bytes);
        InvoiceDTO dto = service.parseInvoice(file);
        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
        assertEquals("STEG", dto.supplierName);
    }

    private boolean isTesseractAvailable() {
        try {
            Process p = new ProcessBuilder("tesseract", "--version").start();
            return p.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    @Test
    void correctsCommonStegOcrMisread448912() {
        String ocr = """
                steg.com.tn
                28520 328 0 FACTURE
                Electricité 612 448,912
                TOTAL GAZ 15,012
                Montant à payer 249,000
                """;

        InvoiceDTO dto = service.parseInvoiceFromOcr(ocr);
        assertEquals(new BigDecimal("118.912"), dto.totalTTC);
    }
}
