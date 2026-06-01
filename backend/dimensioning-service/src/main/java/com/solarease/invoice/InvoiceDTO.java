package com.solarease.invoice;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class InvoiceDTO {
    public String invoiceNumber;
    public String date; // ISO or human readable
    public BigDecimal totalTTC;
    public BigDecimal totalHT;
    public BigDecimal taxAmount;
    public String currency;
    public String supplierName;
    public String supplierAddress;
    public List<InvoiceLine> lines;
    public Map<String, Double> confidences;

    public static class InvoiceLine {
        public String description;
        public String quantity;
        public BigDecimal unitPrice;
        public BigDecimal lineTotal;
    }
}
