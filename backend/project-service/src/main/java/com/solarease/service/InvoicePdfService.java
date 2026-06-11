package com.solarease.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.solarease.entity.Client;
import com.solarease.entity.InvoiceEntity;
import com.solarease.entity.Project;
import com.solarease.entity.QuoteEntity;
import com.solarease.repository.ClientRepository;
import com.solarease.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InvoicePdfService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DecimalFormat MONEY_FMT = new DecimalFormat("#,##0.00");

    private static final Color PRIMARY = new Color(15, 23, 42);
    private static final Color ACCENT = new Color(76, 175, 80);
    private static final Color ACCENT_DARK = new Color(56, 142, 60);
    private static final Color MUTED = new Color(100, 116, 139);
    private static final Color LIGHT_BG = new Color(248, 250, 252);
    private static final Color BORDER = new Color(226, 232, 240);
    private static final Color WHITE = Color.WHITE;

    private static final Font BRAND_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, WHITE);
    private static final Font BRAND_SUB_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(220, 252, 231));
    private static final Font INVOICE_BADGE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, WHITE);
    private static final Font META_LABEL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, MUTED);
    private static final Font META_VALUE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY);
    private static final Font SECTION_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, ACCENT_DARK);
    private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, PRIMARY);
    private static final Font BODY_MUTED = FontFactory.getFont(FontFactory.HELVETICA, 9, MUTED);
    private static final Font TABLE_HEAD_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, WHITE);
    private static final Font TABLE_BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, PRIMARY);
    private static final Font TOTAL_LABEL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, MUTED);
    private static final Font TOTAL_VALUE_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, PRIMARY);
    private static final Font GRAND_TOTAL_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, ACCENT_DARK);
    private static final Font FOOTER_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, MUTED);

    private final ClientRepository clientRepository;
    private final QuoteRepository quoteRepository;

    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(InvoiceEntity invoice) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 48);

        try {
            PdfWriter.getInstance(document, output);
            document.open();

            Client client = resolveClient(invoice);
            QuoteEntity quote = invoice.getQuoteId() != null
                    ? quoteRepository.findById(invoice.getQuoteId()).orElse(null)
                    : null;
            Project project = invoice.getProject();

            addHeaderBand(document, invoice);
            addMetaRow(document, invoice, quote);
            addPartiesSection(document, client, project);
            addLineItemsTable(document, invoice, quote, project);
            addTotalsSection(document, invoice);
            addNotesSection(document, invoice);
            addFooter(document, invoice);

            document.close();
        } catch (DocumentException e) {
            throw new IllegalStateException("Failed to generate invoice PDF", e);
        }

        return output.toByteArray();
    }

    private void addHeaderBand(Document document, InvoiceEntity invoice) throws DocumentException {
        PdfPTable band = new PdfPTable(2);
        band.setWidthPercentage(100);
        band.setWidths(new float[]{3f, 2f});

        PdfPCell brandCell = new PdfPCell();
        brandCell.setBackgroundColor(ACCENT);
        brandCell.setBorder(Rectangle.NO_BORDER);
        brandCell.setPadding(18f);
        brandCell.addElement(new Paragraph("SolarEase", BRAND_FONT));
        brandCell.addElement(new Paragraph("Solutions photovoltaïques — Tunisie", BRAND_SUB_FONT));

        PdfPCell invoiceCell = new PdfPCell();
        invoiceCell.setBackgroundColor(ACCENT_DARK);
        invoiceCell.setBorder(Rectangle.NO_BORDER);
        invoiceCell.setPadding(18f);
        invoiceCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        invoiceCell.addElement(rightAligned(new Paragraph("FACTURE", INVOICE_BADGE_FONT)));
        invoiceCell.addElement(rightAligned(new Paragraph(
                invoice.getNumber() != null ? invoice.getNumber() : "—", BRAND_FONT)));
        invoiceCell.addElement(rightAligned(new Paragraph(
                statusLabel(invoice.getStatus()), BRAND_SUB_FONT)));

        band.addCell(brandCell);
        band.addCell(invoiceCell);
        band.setSpacingAfter(16f);
        document.add(band);
    }

    private void addMetaRow(Document document, InvoiceEntity invoice, QuoteEntity quote)
            throws DocumentException {
        PdfPTable meta = new PdfPTable(3);
        meta.setWidthPercentage(100);
        meta.setWidths(new float[]{1f, 1f, 1f});
        meta.setSpacingAfter(14f);

        meta.addCell(metaBox("Date de facturation", safeDate(invoice.getDate())));
        meta.addCell(metaBox("Date d'échéance", safeDate(invoice.getDueDate())));
        meta.addCell(metaBox("Référence devis",
                quote != null && quote.getQuoteNumber() != null ? quote.getQuoteNumber() : "—"));

        document.add(meta);
    }

    private void addPartiesSection(Document document, Client client, Project project)
            throws DocumentException {
        PdfPTable parties = new PdfPTable(2);
        parties.setWidthPercentage(100);
        parties.setWidths(new float[]{1f, 1f});
        parties.setSpacingAfter(16f);

        parties.addCell(partyBox("ÉMETTEUR",
                "SolarEase SARL",
                "Centre Urbain Nord, Tunis 1082",
                "Tunisie",
                "contact@solarease.tn",
                "+216 70 000 000"));

        String clientName = client != null
                ? client.getFirstName() + " " + client.getLastName()
                : "Client";
        parties.addCell(partyBox("FACTURÉ À",
                clientName,
                client != null && client.getAddress() != null ? client.getAddress() : "—",
                client != null ? client.getEmail() : "—",
                client != null && client.getPhoneNumber() != null ? client.getPhoneNumber() : "—",
                project != null ? "Projet : " + project.getName() : null));

        document.add(parties);
    }

    private void addLineItemsTable(Document document, InvoiceEntity invoice,
                                   QuoteEntity quote, Project project) throws DocumentException {
        document.add(new Paragraph("DÉTAIL DE LA PRESTATION", SECTION_FONT));
        document.add(spacer(6f));

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{4f, 1f, 2f, 2f});
        table.setSpacingAfter(12f);

        addTableHeader(table, "Désignation");
        addTableHeader(table, "Qté");
        addTableHeader(table, "Prix unit. HT");
        addTableHeader(table, "Total HT");

        List<LineItem> items = buildLineItems(invoice, quote, project);
        for (LineItem item : items) {
            addTableRow(table, item.description(), item.quantity(), item.unitPrice(), item.total());
        }

        document.add(table);
    }

    private void addTotalsSection(Document document, InvoiceEntity invoice) throws DocumentException {
        BigDecimal subtotal = invoice.getSubtotal() != null ? invoice.getSubtotal() : invoice.getAmount();
        if (subtotal == null) {
            subtotal = BigDecimal.ZERO;
        }

        BigDecimal discountPct = invoice.getDiscountPercent() != null
                ? invoice.getDiscountPercent() : BigDecimal.ZERO;
        BigDecimal discountFixed = invoice.getDiscountAmount() != null
                ? invoice.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal fromPct = subtotal.multiply(discountPct)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalDiscount = fromPct.add(discountFixed);
        BigDecimal net = invoice.getAmount() != null
                ? invoice.getAmount()
                : subtotal.subtract(totalDiscount).max(BigDecimal.ZERO);

        PdfPTable wrapper = new PdfPTable(2);
        wrapper.setWidthPercentage(100);
        wrapper.setWidths(new float[]{1.6f, 1f});

        PdfPCell spacer = new PdfPCell();
        spacer.setBorder(Rectangle.NO_BORDER);
        wrapper.addCell(spacer);

        PdfPTable totals = new PdfPTable(2);
        totals.setWidthPercentage(100);
        totals.setWidths(new float[]{1.4f, 1f});

        addTotalRow(totals, "Sous-total HT", formatMoney(subtotal), false);
        if (discountPct.signum() > 0) {
            addTotalRow(totals, "Remise (" + discountPct.stripTrailingZeros().toPlainString() + " %)",
                    "− " + formatMoney(fromPct), false);
        }
        if (discountFixed.signum() > 0) {
            addTotalRow(totals, "Remise commerciale", "− " + formatMoney(discountFixed), false);
        }

        PdfPCell separator = new PdfPCell();
        separator.setColspan(2);
        separator.setBorderWidthTop(1f);
        separator.setBorderColor(BORDER);
        separator.setBorderWidthLeft(0);
        separator.setBorderWidthRight(0);
        separator.setBorderWidthBottom(0);
        separator.setFixedHeight(8f);
        totals.addCell(separator);
        totals.addCell(emptyCell());

        addTotalRow(totals, "Montant net à payer", formatMoney(net), true);

        PdfPCell totalsCell = new PdfPCell(totals);
        totalsCell.setBorder(Rectangle.BOX);
        totalsCell.setBorderColor(BORDER);
        totalsCell.setBackgroundColor(LIGHT_BG);
        totalsCell.setPadding(12f);
        wrapper.addCell(totalsCell);

        wrapper.setSpacingAfter(14f);
        document.add(wrapper);
    }

    private void addNotesSection(Document document, InvoiceEntity invoice) throws DocumentException {
        if (invoice.getNotes() == null || invoice.getNotes().isBlank()) {
            return;
        }

        document.add(new Paragraph("NOTES", SECTION_FONT));
        document.add(spacer(4f));

        PdfPTable box = new PdfPTable(1);
        box.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(invoice.getNotes(), BODY_FONT));
        cell.setBackgroundColor(LIGHT_BG);
        cell.setBorderColor(BORDER);
        cell.setPadding(10f);
        box.addCell(cell);
        box.setSpacingAfter(12f);
        document.add(box);
    }

    private void addFooter(Document document, InvoiceEntity invoice) throws DocumentException {
        LineSeparator sep = new LineSeparator();
        sep.setLineColor(BORDER);
        sep.setLineWidth(0.5f);
        document.add(new Chunk(sep));
        document.add(spacer(8f));

        Paragraph legal = new Paragraph(
                "SolarEase SARL — MF 1234567/A/B/M/000 — RIB BIAT 08 012 000123456789 53\n"
                        + "Paiement par virement sous 30 jours. Pénalités de retard : taux légal en vigueur.\n"
                        + "Document généré automatiquement le " + java.time.LocalDate.now().format(DATE_FMT)
                        + " — Réf. " + (invoice.getNumber() != null ? invoice.getNumber() : "—"),
                FOOTER_FONT);
        legal.setAlignment(Element.ALIGN_CENTER);
        document.add(legal);
    }

    // ── Line items ─────────────────────────────────────────────────────

    private record LineItem(String description, String quantity, BigDecimal unitPrice, BigDecimal total) {}

    private List<LineItem> buildLineItems(InvoiceEntity invoice, QuoteEntity quote, Project project) {
        List<LineItem> items = new ArrayList<>();
        String projectLabel = project != null ? project.getName() : "Installation photovoltaïque";

        if (quote != null) {
            if (quote.getMaterialsCost() != null && quote.getMaterialsCost().signum() > 0) {
                items.add(new LineItem(
                        "Matériel photovoltaïque (panneaux, onduleur, câblage)",
                        "1",
                        quote.getMaterialsCost(),
                        quote.getMaterialsCost()));
            }
            if (quote.getLaborCost() != null && quote.getLaborCost().signum() > 0) {
                items.add(new LineItem(
                        "Main d'œuvre & installation — " + projectLabel,
                        "1",
                        quote.getLaborCost(),
                        quote.getLaborCost()));
            }
            if (quote.getTax() != null && quote.getTax().signum() > 0) {
                items.add(new LineItem("TVA / taxes", "1", quote.getTax(), quote.getTax()));
            }
        }

        if (items.isEmpty()) {
            BigDecimal amount = invoice.getSubtotal() != null ? invoice.getSubtotal() : invoice.getAmount();
            if (amount == null) {
                amount = BigDecimal.ZERO;
            }
            items.add(new LineItem(
                    "Prestation solaire — " + projectLabel,
                    "1",
                    amount,
                    amount));
        }

        return items;
    }

    // ── Client resolution ──────────────────────────────────────────────

    private Client resolveClient(InvoiceEntity invoice) {
        if (invoice.getClientId() != null && !invoice.getClientId().isBlank()) {
            Optional<Client> byUser = clientRepository.findByUserId(invoice.getClientId());
            if (byUser.isPresent()) {
                return byUser.get();
            }
            try {
                Long id = Long.parseLong(invoice.getClientId());
                Optional<Client> byId = clientRepository.findById(id);
                if (byId.isPresent()) {
                    return byId.get();
                }
            } catch (NumberFormatException ignored) {
                // not a numeric id
            }
        }
        if (invoice.getProject() != null && invoice.getProject().getClientId() != null) {
            return clientRepository.findById(invoice.getProject().getClientId()).orElse(null);
        }
        return null;
    }

    // ── Cell helpers ───────────────────────────────────────────────────

    private PdfPCell metaBox(String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(BORDER);
        cell.setBackgroundColor(LIGHT_BG);
        cell.setPadding(10f);
        cell.addElement(new Paragraph(label.toUpperCase(), META_LABEL_FONT));
        cell.addElement(new Paragraph(value, META_VALUE_FONT));
        return cell;
    }

    private PdfPCell partyBox(String title, String... lines) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(BORDER);
        cell.setPadding(12f);
        cell.addElement(new Paragraph(title, SECTION_FONT));
        cell.addElement(spacer(4f));
        for (String line : lines) {
            if (line != null && !line.isBlank()) {
                cell.addElement(new Paragraph(line, BODY_FONT));
            }
        }
        return cell;
    }

    private void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TABLE_HEAD_FONT));
        cell.setBackgroundColor(PRIMARY);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(8f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addTableRow(PdfPTable table, String desc, String qty,
                             BigDecimal unit, BigDecimal total) {
        PdfPCell descCell = bodyCell(desc, Element.ALIGN_LEFT);
        descCell.setPaddingLeft(10f);
        table.addCell(descCell);
        table.addCell(bodyCell(qty, Element.ALIGN_CENTER));
        table.addCell(bodyCell(formatMoney(unit), Element.ALIGN_RIGHT));
        table.addCell(bodyCell(formatMoney(total), Element.ALIGN_RIGHT));
    }

    private PdfPCell bodyCell(String text, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, TABLE_BODY_FONT));
        cell.setBorderColor(BORDER);
        cell.setPadding(8f);
        cell.setHorizontalAlignment(align);
        cell.setBackgroundColor(WHITE);
        return cell;
    }

    private void addTotalRow(PdfPTable table, String label, String value, boolean grand) {
        Font labelFont = grand ? GRAND_TOTAL_FONT : TOTAL_LABEL_FONT;
        Font valueFont = grand ? GRAND_TOTAL_FONT : TOTAL_VALUE_FONT;

        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        labelCell.setPadding(4f);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        valueCell.setPadding(4f);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private PdfPCell emptyCell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }

    private Paragraph rightAligned(Paragraph p) {
        p.setAlignment(Element.ALIGN_RIGHT);
        return p;
    }

    private Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(height);
        return p;
    }

    private String safeDate(java.time.LocalDate d) {
        return d == null ? "—" : d.format(DATE_FMT);
    }

    private String formatMoney(BigDecimal value) {
        if (value == null) {
            return "0,00 TND";
        }
        return MONEY_FMT.format(value.setScale(2, RoundingMode.HALF_UP)) + " TND";
    }

    private String statusLabel(InvoiceEntity.InvoiceStatus status) {
        if (status == null) {
            return "—";
        }
        return switch (status) {
            case DRAFT -> "Brouillon";
            case SENT -> "Envoyée";
            case PAID -> "Payée";
            case OVERDUE -> "En retard";
            case CANCELLED -> "Annulée";
        };
    }
}
