package com.solarease.invoice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/dimensioning/invoices")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private InvoiceParseJobService invoiceParseJobService;

    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<InvoiceDTO> parseInvoice(@RequestParam("file") MultipartFile file) {
        try {
            InvoiceDTO dto = invoiceService.parseInvoice(file);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    /** Returns immediately — avoids Vercel 120s proxy timeout on long OCR runs. */
    @PostMapping(value = "/parse-async", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> parseInvoiceAsync(@RequestParam("file") MultipartFile file) {
        try {
            String jobId = invoiceParseJobService.enqueue(file);
            return ResponseEntity.accepted().body(Map.of("jobId", jobId, "status", "PENDING"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed"));
        }
    }

    @GetMapping("/parse-jobs/{jobId}")
    public ResponseEntity<InvoiceParseJobStatus> parseInvoiceJobStatus(@PathVariable String jobId) {
        InvoiceParseJobStatus status = invoiceParseJobService.getStatus(jobId);
        if (status == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status);
    }
}
