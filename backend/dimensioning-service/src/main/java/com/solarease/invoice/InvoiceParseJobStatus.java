package com.solarease.invoice;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InvoiceParseJobStatus {
    private String jobId;
    private String status;
    private InvoiceDTO result;
    private String error;
}
