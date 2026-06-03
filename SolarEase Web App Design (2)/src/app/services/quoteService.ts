import api from "./api";

export type QuoteStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "INVOICED";

export interface Quote {
  id: number;
  quoteNumber: string;
  projectId: number;
  projectName?: string;
  clientId: number;
  clientFirstName?: string;
  clientLastName?: string;
  installerId: string;
  status: QuoteStatus;
  description?: string;
  laborCost: number;
  materialsCost: number;
  tax?: number;
  totalAmount: number;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface QuotePage {
  content: Quote[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface QuoteCreateRequest {
  projectId: number;
  description?: string;
  laborCost: number;
  materialsCost: number;
  tax?: number;
  notes?: string;
  validUntil?: string;
}

export interface QuoteRejectRequest {
  rejectionReason?: string;
}

const quoteService = {
  getAllQuotes: async (page = 0, size = 100) => {
    const res = await api.get<QuotePage>(`/quotes/admin/all?page=${page}&size=${size}`);
    return res.data;
  },

  getInstallerQuotes: async (page = 0, size = 20) => {
    const res = await api.get<QuotePage>(`/quotes/installer/list?page=${page}&size=${size}`);
    return res.data;
  },

  getClientQuotes: async (page = 0, size = 20) => {
    const res = await api.get<QuotePage>(`/quotes/client/list?page=${page}&size=${size}`);
    return res.data;
  },

  getProjectQuotes: async (projectId: number) => {
    const res = await api.get<Quote[]>(`/quotes/project/${projectId}`);
    return res.data;
  },

  createQuote: async (payload: QuoteCreateRequest) => {
    const res = await api.post<Quote>("/quotes", payload);
    return res.data;
  },

  updateQuote: async (quoteId: number, payload: Partial<QuoteCreateRequest>) => {
    const res = await api.patch<Quote>(`/quotes/${quoteId}`, payload);
    return res.data;
  },

  sendQuote: async (quoteId: number) => {
    const res = await api.put<Quote>(`/quotes/${quoteId}/send`);
    return res.data;
  },

  acceptQuote: async (quoteId: number) => {
    const res = await api.put<Quote>(`/quotes/${quoteId}/accept`);
    return res.data;
  },

  rejectQuote: async (quoteId: number, payload: QuoteRejectRequest) => {
    const res = await api.put<Quote>(`/quotes/${quoteId}/reject`, payload);
    return res.data;
  },

  deleteQuote: async (quoteId: number) => {
    await api.delete(`/quotes/${quoteId}`);
  },

  expireQuote: async (quoteId: number) => {
    const res = await api.put<Quote>(`/quotes/${quoteId}/expire`);
    return res.data;
  },

  getActiveProjectQuotes: async (projectId: number) => {
    const res = await api.get<Quote[]>(`/quotes/project/${projectId}/active`);
    return res.data;
  },

  getQuoteById: async (quoteId: number) => {
    const res = await api.get<Quote>(`/quotes/${quoteId}`);
    return res.data;
  },

  previewQuotePdf: (quote: Partial<Quote> & { laborCost: number; materialsCost: number; totalAmount: number }) => {
    quoteService._renderPdfWindow(quote, false);
  },

  printQuotePdf: (quote: Quote) => {
    quoteService._renderPdfWindow(quote, true);
  },

  _renderPdfWindow: (quote: Partial<Quote> & { laborCost: number; materialsCost: number; totalAmount: number }, autoPrint: boolean) => {
    const fmt = (v: number) =>
      new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    const dateStr = (iso?: string) => {
      if (!iso) return "—";
      return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    };

    const today = new Date().toISOString();
    const validUntil = quote.validUntil ?? new Date(Date.now() + 30 * 86400000).toISOString();

    const statusLabel: Record<string, string> = {
      DRAFT: "Brouillon",
      SENT: "Envoyé",
      ACCEPTED: "Accepté",
      REJECTED: "Refusé",
      EXPIRED: "Expiré",
      INVOICED: "Facturé",
    };

    const isPreview = !quote.quoteNumber;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${isPreview ? "Aperçu devis" : `Devis ${quote.quoteNumber}`}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
    .preview-banner { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px 16px; border-radius: 6px; font-size: 13px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4CAF50; padding-bottom: 24px; margin-bottom: 32px; }
    .brand { font-size: 26px; font-weight: 700; color: #4CAF50; letter-spacing: -0.5px; }
    .brand span { color: #1a1a2e; }
    .meta { text-align: right; font-size: 13px; color: #555; }
    .meta .quote-num { font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #e8f5e9; color: #2e7d32; margin-top: 4px; }
    .preview-badge { background: #fff3cd; color: #856404; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #4CAF50; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-block { background: #f9fafb; border-radius: 8px; padding: 16px; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .info-row .label { color: #666; }
    .info-row .value { font-weight: 600; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table th { background: #4CAF50; color: #fff; text-align: left; padding: 10px 14px; font-size: 12px; }
    .table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    .table tr:last-child td { border-bottom: none; }
    .totals { max-width: 320px; margin-left: auto; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
    .total-row.grand { border-top: 2px solid #4CAF50; border-bottom: none; margin-top: 4px; font-size: 16px; font-weight: 700; color: #2e7d32; }
    .notes { background: #fffde7; border-left: 3px solid #fbc02d; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #555; margin-top: 24px; }
    .footer { text-align: center; font-size: 11px; color: #aaa; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px; }
    @media print {
      .preview-banner { display: none; }
      body { padding: 20px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  ${isPreview ? `<div class="preview-banner">⚠️ Aperçu avant création — Ce document n'a pas encore été enregistré.</div>` : ""}
  <div class="header">
    <div>
      <div class="brand">Solar<span>Ease</span></div>
      <div style="font-size:12px;color:#666;margin-top:4px;">Plateforme de dimensionnement solaire</div>
    </div>
    <div class="meta">
      <div class="quote-num">${quote.quoteNumber ?? "DEVIS-APERÇU"}</div>
      <div class="badge ${isPreview ? "preview-badge" : ""}">${isPreview ? "Aperçu" : (statusLabel[quote.status!] ?? quote.status)}</div>
      <div style="margin-top:8px;">Créé le ${dateStr(quote.createdAt ?? today)}</div>
      <div>Valide jusqu'au ${dateStr(validUntil)}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <div class="section-title">Informations projet</div>
      <div class="info-row"><span class="label">Projet ID</span><span class="value">#${quote.projectId ?? "—"}</span></div>
      ${quote.installerId ? `<div class="info-row"><span class="label">Installateur</span><span class="value">${quote.installerId}</span></div>` : ""}
    </div>
    <div class="info-block">
      <div class="section-title">Dates</div>
      <div class="info-row"><span class="label">Création</span><span class="value">${dateStr(quote.createdAt ?? today)}</span></div>
      <div class="info-row"><span class="label">Expiration</span><span class="value">${dateStr(validUntil)}</span></div>
      ${quote.sentAt ? `<div class="info-row"><span class="label">Envoyé le</span><span class="value">${dateStr(quote.sentAt)}</span></div>` : ""}
      ${quote.acceptedAt ? `<div class="info-row"><span class="label">Accepté le</span><span class="value">${dateStr(quote.acceptedAt)}</span></div>` : ""}
    </div>
  </div>

  ${quote.description ? `<div style="margin-bottom:24px;"><div class="section-title">Description des travaux</div><p style="font-size:14px;color:#333;line-height:1.6;">${quote.description}</p></div>` : ""}

  <div class="section-title">Détail du devis</div>
  <table class="table">
    <thead>
      <tr>
        <th>Poste</th>
        <th style="text-align:right;">Montant (TND)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Main d'œuvre</td><td style="text-align:right;">${fmt(quote.laborCost)}</td></tr>
      <tr><td>Matériaux</td><td style="text-align:right;">${fmt(quote.materialsCost)}</td></tr>
      <tr><td>Taxes / TVA</td><td style="text-align:right;">${fmt(quote.tax ?? 0)}</td></tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Main d'œuvre</span><span>${fmt(quote.laborCost)} TND</span></div>
    <div class="total-row"><span>Matériaux</span><span>${fmt(quote.materialsCost)} TND</span></div>
    <div class="total-row"><span>Taxes</span><span>${fmt(quote.tax ?? 0)} TND</span></div>
    <div class="total-row grand"><span>TOTAL TTC</span><span>${fmt(quote.totalAmount)} TND</span></div>
  </div>

  ${quote.notes ? `<div class="notes"><strong>Notes internes :</strong> ${quote.notes}</div>` : ""}

  <div class="footer">SolarEase — Plateforme de dimensionnement et gestion de projets solaires</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    if (autoPrint) {
      win.onload = () => win.print();
    }
  },
};

export default quoteService;
