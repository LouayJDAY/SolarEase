package com.solarease.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.solarease.entity.Dimensioning;
import com.solarease.entity.Equipment;
import com.solarease.entity.SolarInstallation;
import com.solarease.enums.EquipmentType;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.stream.Stream;

@Service
public class PdfGenerationService {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BaseColor.BLACK);
    private static final Font SUBTITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.GRAY);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE);
    private static final Font NORMAL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 12, BaseColor.BLACK);
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,##0.00 TND");
    private static final DecimalFormat ENERGY_FORMAT = new DecimalFormat("#,##0.00 kWh");

    public ByteArrayInputStream generateDimensioningReport(Dimensioning dimensioning) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Header
            addHeader(document, dimensioning);

            // 2. Project Overview
            addSectionTitle(document, "Project Overview");
            addProjectDetails(document, dimensioning);

            // 3. Technical Solution (Equipment)
            addSectionTitle(document, "Technical Solution");
            addEquipmentTable(document, dimensioning);

            // 4. Financial Analysis
            addSectionTitle(document, "Financial Analysis & ROI");
            addFinancialTable(document, dimensioning);
            
            // 5. AI Recommendation
            addSectionTitle(document, "AI Recommendation");
            addAiRecommendation(document, dimensioning.getAiRecommendation());

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private void addHeader(Document document, Dimensioning dimensioning) throws DocumentException {
        Paragraph title = new Paragraph("Solar PV Installation Proposal", TITLE_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        
        Paragraph date = new Paragraph("Date: " + dimensioning.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), NORMAL_FONT);
        date.setAlignment(Element.ALIGN_CENTER);
        date.setSpacingAfter(20);
        document.add(date);
    }

    private void addSectionTitle(Document document, String titleText) throws DocumentException {
        Paragraph title = new Paragraph(titleText, SUBTITLE_FONT);
        title.setSpacingBefore(15);
        title.setSpacingAfter(10);
        document.add(title);
        // Add a line separator
        document.add(new Paragraph("______________________________________________________________________________"));
        document.add(Chunk.NEWLINE);
    }

    private void addProjectDetails(Document document, Dimensioning dimensioning) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);

        addTableRow(table, "Project ID:", dimensioning.getProjectId().toString());
        addTableRow(table, "Location:", String.format("Lat: %.4f, Lon: %.4f", 
                dimensioning.getRoofCharacteristic().getLatitude(), 
                dimensioning.getRoofCharacteristic().getLongitude()));
        addTableRow(table, "Roof Type:", dimensioning.getRoofCharacteristic().getType().toString());
        addTableRow(table, "Available Area:", dimensioning.getRoofCharacteristic().getArea() + " m²");
        
        document.add(table);
    }

    private void addEquipmentTable(Document document, Dimensioning dimensioning) throws DocumentException {
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3, 2, 2});

        addTableHeader(table, "Component", "Model", "Quantity/Spec");

        SolarInstallation install = dimensioning.getSolarInstallation();
        Equipment panel = dimensioning.getPanel();
        Equipment inverter = dimensioning.getInverter();

        // Panel Row
        String panelName = (panel != null) ? panel.getBrand() + " " + panel.getModel() : "Generic Panel";
        String panelSpec = (panel != null) ? panel.getNominalPower() + " W" : "400 W";
        table.addCell(createCell("Solar Panels (" + panelSpec + ")"));
        table.addCell(createCell(panelName));
        table.addCell(createCell(install.getPanelCount() + " Units"));

        // Inverter Row
        String inverterName = (inverter != null) ? inverter.getBrand() + " " + inverter.getModel() : "Generic Inverter";
        String inverterSpec = (inverter != null) ? inverter.getNominalPower()/1000 + " kW" : install.getInverterModel();
        table.addCell(createCell("Inverter"));
        table.addCell(createCell(inverterName));
        table.addCell(createCell("1 Unit"));

        // System Size
        table.addCell(createCell("Total System Size"));
        table.addCell(createCell("-"));
        table.addCell(createCell(install.getTotalCapacityKw() + " kWp"));

        document.add(table);
    }

    private void addFinancialTable(Document document, Dimensioning dimensioning) throws DocumentException {
        SolarInstallation install = dimensioning.getSolarInstallation();
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);

        addTableRow(table, "Total Estimated Cost:", CURRENCY_FORMAT.format(install.getEstimatedCost() != null ? install.getEstimatedCost() : 0));
        addTableRow(table, "Annual Production:", ENERGY_FORMAT.format(install.getEstimatedAnnualProductionKwh()));
        addTableRow(table, "Annual CO2 Savings:", install.getCo2Savings() + " kg");
        addTableRow(table, "Monthly Bill Savings:", CURRENCY_FORMAT.format(install.getMonthlySavings()));
        
        // Simple Payback Calculation (Investment / Annual Savings)
        // Note: Real payback is in FinancialMetrics but stored inside the ephemeral object in previous step.
        // We can re-calculate simply here or just show basic stats. 
        // Ideally we should persist FinancialROI in Dimensioning entity properly (we added the relation but didn't fill it yet).
        // For now, let's use the simple calculation based on savings.
        
        double annualSavings = install.getMonthlySavings() * 12;
        double cost = install.getEstimatedCost() != null ? install.getEstimatedCost() : 0;
        double payback = (annualSavings > 0) ? cost / annualSavings : 0;
        
        addTableRow(table, "Estimated Payback Period:", String.format("%.1f Years", payback));

        document.add(table);
    }

    private void addAiRecommendation(Document document, String recommendation) throws DocumentException {
        if (recommendation != null && !recommendation.isEmpty()) {
            Paragraph p = new Paragraph(recommendation, NORMAL_FONT);
            p.setAlignment(Element.ALIGN_JUSTIFIED);
            document.add(p);
        } else {
            document.add(new Paragraph("No specific recommendation generated.", NORMAL_FONT));
        }
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        Stream.of(headers).forEach(columnTitle -> {
            PdfPCell header = new PdfPCell();
            header.setBackgroundColor(BaseColor.DARK_GRAY);
            header.setBorderWidth(2);
            header.setPhrase(new Phrase(columnTitle, HEADER_FONT));
            header.setHorizontalAlignment(Element.ALIGN_CENTER);
            header.setVerticalAlignment(Element.ALIGN_MIDDLE);
            header.setPadding(5);
            table.addCell(header);
        });
    }

    private void addTableRow(PdfPTable table, String key, String value) {
        PdfPCell cellKey = new PdfPCell(new Phrase(key, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
        cellKey.setPadding(5);
        cellKey.setBorderColor(BaseColor.LIGHT_GRAY);
        table.addCell(cellKey);

        PdfPCell cellValue = new PdfPCell(new Phrase(value, NORMAL_FONT));
        cellValue.setPadding(5);
        cellValue.setBorderColor(BaseColor.LIGHT_GRAY);
        table.addCell(cellValue);
    }

    private PdfPCell createCell(String content) {
        PdfPCell cell = new PdfPCell(new Phrase(content, NORMAL_FONT));
        cell.setPadding(5);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }
}
