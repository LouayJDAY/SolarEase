package com.solarease.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.solarease.entity.InvoiceEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

@Service
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generateInvoicePdf(InvoiceEntity invoice) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();

        Document document = new Document();
        PdfWriter.getInstance(document, output);
        document.open();

        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
        Font textFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
        Font labelFont = new Font(Font.HELVETICA, 11, Font.BOLD);

        document.add(new Paragraph("SolarEase - Facture", titleFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100f);
        table.setSpacingBefore(8f);
        table.setSpacingAfter(12f);
        table.setWidths(new float[]{1.5f, 2.5f});

        addRow(table, "Numero", invoice.getNumber(), labelFont, textFont);
        addRow(table, "Date", safeDate(invoice.getDate()), labelFont, textFont);
        addRow(table, "Echeance", safeDate(invoice.getDueDate()), labelFont, textFont);
        addRow(table, "Montant", formatAmount(invoice), labelFont, textFont);
        addRow(table, "Statut", invoice.getStatus() == null ? "-" : invoice.getStatus().name(), labelFont, textFont);
        addRow(table, "Projet", invoice.getProject() == null ? "-" : invoice.getProject().getName(), labelFont, textFont);

        document.add(table);

        String notes = (invoice.getNotes() == null || invoice.getNotes().isBlank())
                ? "Aucune note"
                : invoice.getNotes();
        document.add(new Paragraph("Notes", labelFont));
        document.add(new Paragraph(notes, textFont));

        document.add(new Paragraph(" "));
        document.add(new Paragraph("Document genere automatiquement par SolarEase.", textFont));

        document.close();
        return output.toByteArray();
    }

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        PdfPCell valueCell = new PdfPCell(new Phrase(value == null ? "-" : value, valueFont));
        labelCell.setPadding(8f);
        valueCell.setPadding(8f);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String safeDate(java.time.LocalDate d) {
        return d == null ? "-" : d.format(DATE_FMT);
    }

    private String formatAmount(InvoiceEntity invoice) {
        if (invoice.getAmount() == null) {
            return "0.00 TND";
        }
        return invoice.getAmount().setScale(2, RoundingMode.HALF_UP) + " TND";
    }
}
