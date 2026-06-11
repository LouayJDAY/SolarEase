package com.solarease.invoice;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class InvoiceParseJobService {

    private final InvoiceService invoiceService;
    private final Map<String, InvoiceParseJobStatus> jobs = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public InvoiceParseJobService(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    public String enqueue(MultipartFile file) throws Exception {
        String jobId = UUID.randomUUID().toString();
        Path temp = Files.createTempFile("invoice-job-", extension(file.getOriginalFilename()));
        file.transferTo(temp);

        jobs.put(jobId, InvoiceParseJobStatus.builder().jobId(jobId).status("PENDING").build());

        executor.execute(() -> {
            try {
                InvoiceDTO dto = invoiceService.parseInvoiceFromPath(temp);
                jobs.put(jobId, InvoiceParseJobStatus.builder()
                        .jobId(jobId)
                        .status("COMPLETED")
                        .result(dto)
                        .build());
            } catch (Exception e) {
                jobs.put(jobId, InvoiceParseJobStatus.builder()
                        .jobId(jobId)
                        .status("FAILED")
                        .error(e.getMessage() != null ? e.getMessage() : "OCR failed")
                        .build());
            } finally {
                try {
                    Files.deleteIfExists(temp);
                } catch (Exception ignored) {
                    /* ignore */
                }
            }
        });

        return jobId;
    }

    public InvoiceParseJobStatus getStatus(String jobId) {
        return jobs.get(jobId);
    }

    private static String extension(String name) {
        if (name == null || !name.contains(".")) {
            return ".bin";
        }
        return name.substring(name.lastIndexOf('.'));
    }
}
