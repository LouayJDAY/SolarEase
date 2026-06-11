package com.solarease.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.solarease.entity.DocumentEntity;
import com.solarease.entity.Project;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class DocumentPdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Color PRIMARY = new Color(15, 23, 42);
    private static final Color ACCENT = new Color(76, 175, 80);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, PRIMARY);
    private static final Font SECTION_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, ACCENT);
    private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, PRIMARY);
    private static final Font MUTED_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, MUTED);

    public byte[] generateDocumentPdf(DocumentEntity document) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document pdf = new Document(PageSize.A4, 48, 48, 48, 48);

        try {
            PdfWriter.getInstance(pdf, output);
            pdf.open();

            Paragraph brand = new Paragraph("SolarEase", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, ACCENT));
            brand.setSpacingAfter(4);
            pdf.add(brand);

            Paragraph title = new Paragraph(document.getName(), TITLE_FONT);
            title.setSpacingAfter(12);
            pdf.add(title);

            pdf.add(new LineSeparator(0.5f, 100, MUTED, Element.ALIGN_CENTER, -2));
            pdf.add(Chunk.NEWLINE);

            Project project = document.getProject();
            addField(pdf, "Type", document.getType().name());
            if (project != null) {
                addField(pdf, "Projet", project.getName());
            }
            if (document.getDate() != null) {
                addField(pdf, "Date", document.getDate().format(DATE_FMT));
            }
            if (document.getSize() != null) {
                addField(pdf, "Taille", document.getSize());
            }

            pdf.add(Chunk.NEWLINE);
            Paragraph descTitle = new Paragraph("Description", SECTION_FONT);
            descTitle.setSpacingAfter(6);
            pdf.add(descTitle);

            String description = document.getDescription() != null && !document.getDescription().isBlank()
                    ? document.getDescription()
                    : "Document généré par SolarEase pour votre projet solaire.";
            Paragraph desc = new Paragraph(description, BODY_FONT);
            desc.setSpacingAfter(12);
            pdf.add(desc);

            if (document.getNotes() != null && !document.getNotes().isBlank()) {
                Paragraph notesTitle = new Paragraph("Notes", SECTION_FONT);
                notesTitle.setSpacingAfter(6);
                pdf.add(notesTitle);
                pdf.add(new Paragraph(document.getNotes(), BODY_FONT));
            }

            pdf.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph(
                    "Document SolarEase — réf. " + document.getId(),
                    MUTED_FONT);
            footer.setAlignment(Element.ALIGN_CENTER);
            pdf.add(footer);

            pdf.close();
            return output.toByteArray();
        } catch (DocumentException e) {
            log.error("Failed to generate document PDF for id {}", document.getId(), e);
            throw new IllegalStateException("PDF generation failed", e);
        }
    }

    private void addField(Document pdf, String label, String value) throws DocumentException {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " : ", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY)));
        p.add(new Chunk(value, BODY_FONT));
        p.setSpacingAfter(6);
        pdf.add(p);
    }
}
