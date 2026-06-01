package com.solarease.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.draw.LineSeparator;
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

    private static final BaseColor PRIMARY_COLOR = new BaseColor(15, 23, 42);
    private static final BaseColor ACCENT_COLOR = new BaseColor(34, 197, 94);
    private static final BaseColor MUTED_COLOR = new BaseColor(100, 116, 139);
    private static final BaseColor LIGHT_SECTION_COLOR = new BaseColor(248, 250, 252);
    private static final BaseColor BOX_BACKGROUND = new BaseColor(241, 245, 249);

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, PRIMARY_COLOR);
    private static final Font SUBTITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, PRIMARY_COLOR);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BaseColor.WHITE);
    private static final Font NORMAL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 12, BaseColor.BLACK);
    private static final Font SMALL_MUTED_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, MUTED_COLOR);
    private static final Font LABEL_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, PRIMARY_COLOR);
    private static final Font KPI_VALUE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, ACCENT_COLOR);
    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("#,##0.00 TND");
    private static final DecimalFormat ENERGY_FORMAT = new DecimalFormat("#,##0.00 kWh");

    public ByteArrayInputStream generateDimensioningReport(Dimensioning dimensioning) {
        return generateDimensioningReport(dimensioning, null);
    }

    public ByteArrayInputStream generateDimensioningReport(
            Dimensioning dimensioning,
            com.solarease.rag.InstallerRecommendationDto recommendation) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            addHeader(document, dimensioning);
            addExecutiveSummary(document, dimensioning);

            addSectionTitle(document, "Project Overview");
            addProjectDetails(document, dimensioning);

            addSectionTitle(document, "Technical Solution");
            addEquipmentTable(document, dimensioning);

            if (recommendation != null && recommendation.getRecommendedKit() != null) {
                addSectionTitle(document, "Kit recommandé (catalogue société)");
                addRecommendedKit(document, recommendation);
            }

            addSectionTitle(document, "Financial Analysis & ROI");
            addFinancialTable(document, dimensioning);

            addSectionTitle(document, "AI Recommendation");
            addAiRecommendation(document, dimensioning.getAiRecommendation());

            if (recommendation != null) {
                addRecommendationDetails(document, recommendation);
            }

            addFooter(document);

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private void addHeader(Document document, Dimensioning dimensioning) throws DocumentException {
        Paragraph title = new Paragraph("SolarEase - Solar PV Installation Proposal", TITLE_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(4);
        document.add(title);

        Paragraph subtitle = new Paragraph("Professional sizing report generated for your project", SMALL_MUTED_FONT);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(6);
        document.add(subtitle);

        Paragraph date = new Paragraph("Date: " + dimensioning.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")), SMALL_MUTED_FONT);
        date.setAlignment(Element.ALIGN_CENTER);
        date.setSpacingAfter(12);
        document.add(date);

        LineSeparator separator = new LineSeparator();
        separator.setLineWidth(1.2f);
        separator.setLineColor(ACCENT_COLOR);
        document.add(new Chunk(separator));
        document.add(Chunk.NEWLINE);
    }

    private void addExecutiveSummary(Document document, Dimensioning dimensioning) throws DocumentException {
        SolarInstallation install = dimensioning.getSolarInstallation();
        PdfPTable summary = new PdfPTable(3);
        summary.setWidthPercentage(100);
        summary.setSpacingBefore(8f);
        summary.setSpacingAfter(12f);
        summary.setWidths(new float[]{1.5f, 1.5f, 1.5f});

        addSummaryBox(summary, "System size", String.format("%.2f kWp", defaultDouble(install.getTotalCapacityKw())), "Installed PV capacity");
        addSummaryBox(summary, "Annual production", ENERGY_FORMAT.format(install.getEstimatedAnnualProductionKwh()), "Expected yearly output");
        addSummaryBox(summary, "Estimated cost", CURRENCY_FORMAT.format(defaultDouble(install.getEstimatedCost())), "Approximate project budget");

        document.add(summary);
    }

    private void addSectionTitle(Document document, String titleText) throws DocumentException {
        Paragraph title = new Paragraph(titleText, SUBTITLE_FONT);
        title.setSpacingBefore(10);
        title.setSpacingAfter(8);
        document.add(title);

        LineSeparator separator = new LineSeparator();
        separator.setLineWidth(0.8f);
        separator.setLineColor(LIGHT_SECTION_COLOR);
        document.add(new Chunk(separator));
        document.add(Chunk.NEWLINE);
    }

    private void addProjectDetails(Document document, Dimensioning dimensioning) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);

        addTableRow(table, "Project ID:", String.valueOf(dimensioning.getProjectId()));
        addTableRow(table, "Location:", String.format("Lat: %.4f, Lon: %.4f", 
                dimensioning.getRoofCharacteristic().getLatitude(), 
                dimensioning.getRoofCharacteristic().getLongitude()));
        addTableRow(table, "Roof Type:", dimensioning.getRoofCharacteristic().getType().toString());
        addTableRow(table, "Available Area:", String.format("%.2f m²", dimensioning.getRoofCharacteristic().getArea()));
        addTableRow(table, "System Type:", safeText(dimensioning.getPanelType()));
        
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
        table.addCell(createCell("Inverter"));
        table.addCell(createCell(inverterName));
        table.addCell(createCell(inverter != null ? String.format("%.2f kW", inverter.getNominalPower() / 1000.0) : install.getInverterModel()));

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

        addTableRow(table, "Total Estimated Cost:", CURRENCY_FORMAT.format(defaultDouble(install.getEstimatedCost())));
        addTableRow(table, "Annual Production:", ENERGY_FORMAT.format(install.getEstimatedAnnualProductionKwh()));
        addTableRow(table, "Annual CO2 Savings:", install.getCo2Savings() + " kg");
        addTableRow(table, "Monthly Bill Savings:", CURRENCY_FORMAT.format(defaultDouble(install.getMonthlySavings())));

        double annualSavings = install.getMonthlySavings() * 12;
        double cost = defaultDouble(install.getEstimatedCost());
        double payback = (annualSavings > 0) ? cost / annualSavings : 0;
        
        addTableRow(table, "Estimated Payback Period:", String.format("%.1f Years", payback));

        document.add(table);
    }

    private void addAiRecommendation(Document document, String recommendation) throws DocumentException {
        PdfPTable recommendationBox = new PdfPTable(1);
        recommendationBox.setWidthPercentage(100);

        PdfPCell cell = new PdfPCell();
        cell.setPadding(12);
        cell.setBackgroundColor(BOX_BACKGROUND);
        cell.setBorderColor(LIGHT_SECTION_COLOR);

        if (recommendation != null && !recommendation.isBlank()) {
            Paragraph p = new Paragraph(recommendation.trim(), NORMAL_FONT);
            p.setAlignment(Element.ALIGN_JUSTIFIED);
            p.setLeading(0, 1.25f);
            cell.addElement(p);
        } else {
            cell.addElement(new Paragraph("No specific recommendation generated.", NORMAL_FONT));
        }

        recommendationBox.addCell(cell);
        document.add(recommendationBox);
    }

    private void addRecommendedKit(Document document,
                                   com.solarease.rag.InstallerRecommendationDto rec)
            throws DocumentException {
        com.solarease.rag.InstallerRecommendationDto.RecommendedKit kit = rec.getRecommendedKit();

        Paragraph verdict = new Paragraph(
                String.format("Verdict: %s • Score compatibilité: %d/100",
                        rec.getVerdict(), rec.getCompatibilityScore()),
                LABEL_FONT);
        verdict.setSpacingAfter(6);
        document.add(verdict);

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2.5f, 4.0f, 2.5f});
        addTableHeader(table, "Composant", "Référence", "Caractéristique");

        if (kit.getInverter() != null) {
            table.addCell(createCell("Onduleur"));
            table.addCell(createCell(safeText(kit.getInverter().getBrand()
                    + " " + kit.getInverter().getModel())));
            table.addCell(createCell(String.format("%.1f kW (%s)",
                    kit.getInverter().getPowerKw(),
                    safeText(kit.getInverter().getPhase()))));
        }
        if (kit.getDcCable() != null) {
            table.addCell(createCell("Câble DC"));
            table.addCell(createCell(safeText(kit.getDcCable().getBrand())
                    + " (" + safeText(kit.getDcCable().getStandard()) + ")"));
            table.addCell(createCell(String.format("%.1f mm²",
                    kit.getDcCable().getSectionMm2())));
        }
        if (kit.getAcCable() != null) {
            table.addCell(createCell("Câble AC"));
            table.addCell(createCell(safeText(kit.getAcCable().getBrand())
                    + " (" + safeText(kit.getAcCable().getStandard()) + ")"));
            table.addCell(createCell(String.format("%.1f mm²",
                    kit.getAcCable().getSectionMm2())));
        }
        if (kit.getDcBreaker() != null) {
            table.addCell(createCell("Disjoncteur DC"));
            table.addCell(createCell("Schneider " + safeText(kit.getDcBreaker().getReference())));
            table.addCell(createCell(kit.getDcBreaker().getRatingA() + " A"));
        }
        if (kit.getAcBreaker() != null) {
            table.addCell(createCell("Disjoncteur AC"));
            table.addCell(createCell("Schneider " + safeText(kit.getAcBreaker().getReference())));
            table.addCell(createCell(kit.getAcBreaker().getRatingA() + " A"));
        }
        document.add(table);

        if (kit.getTotalKitPrice() != null) {
            Paragraph price = new Paragraph(
                    "Prix indicatif kit catalogue: "
                            + CURRENCY_FORMAT.format(kit.getTotalKitPrice().doubleValue()),
                    SMALL_MUTED_FONT);
            price.setSpacingBefore(6);
            document.add(price);
        }
    }

    private void addRecommendationDetails(Document document,
                                          com.solarease.rag.InstallerRecommendationDto rec)
            throws DocumentException {
        addBulletList(document, "Alertes terrain", rec.getAlerts());
        addBulletList(document, "Arguments client", rec.getClientArguments());
        addBulletList(document, "Checklist d'installation", rec.getTerrainChecklist());
    }

    private void addBulletList(Document document, String heading, java.util.List<String> items)
            throws DocumentException {
        if (items == null || items.isEmpty()) {
            return;
        }
        Paragraph h = new Paragraph(heading, LABEL_FONT);
        h.setSpacingBefore(8);
        h.setSpacingAfter(4);
        document.add(h);
        com.itextpdf.text.List list = new com.itextpdf.text.List(false, 10);
        list.setListSymbol("• ");
        for (String item : items) {
            list.add(new com.itextpdf.text.ListItem(item, NORMAL_FONT));
        }
        document.add(list);
    }

    private void addFooter(Document document) throws DocumentException {
        Paragraph footer = new Paragraph("Generated by SolarEase • This report summarizes the current sizing assumptions and should be reviewed before final installation.", SMALL_MUTED_FONT);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(14);
        document.add(footer);
    }

    private void addSummaryBox(PdfPTable table, String label, String value, String caption) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(10);
        cell.setBackgroundColor(BOX_BACKGROUND);
        cell.setBorderColor(LIGHT_SECTION_COLOR);

        Paragraph labelParagraph = new Paragraph(label, LABEL_FONT);
        labelParagraph.setSpacingAfter(4f);
        cell.addElement(labelParagraph);

        Paragraph valueParagraph = new Paragraph(value, KPI_VALUE_FONT);
        valueParagraph.setSpacingAfter(4f);
        cell.addElement(valueParagraph);

        Paragraph captionParagraph = new Paragraph(caption, SMALL_MUTED_FONT);
        cell.addElement(captionParagraph);

        table.addCell(cell);
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
        PdfPCell cellKey = new PdfPCell(new Phrase(key, LABEL_FONT));
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

    private double defaultDouble(Double value) {
        return value != null ? value : 0d;
    }

    private String safeText(String value) {
        return value == null || value.isBlank() ? "N/A" : value;
    }
}
