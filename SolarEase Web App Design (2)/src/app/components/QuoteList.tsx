import React from "react";
import {
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  FileText,
  Briefcase,
  User,
  Hammer,
} from "lucide-react";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import type { Quote } from "../services/quoteService";

interface Props {
  quotes: Quote[];
  role: "INSTALLER" | "CLIENT" | "ADMIN";
  onSend?: (id: number) => void;
  onAccept?: (id: number) => void;
  onReject?: (quote: Quote) => void;
  onDelete?: (id: number) => void;
  onPreviewPdf?: (quote: Quote) => void;
  onOpenDetail?: (quote: Quote) => void;
  emptyMessage?: string;
}

const money = (value: number) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function QuoteList({
  quotes,
  role,
  onSend,
  onAccept,
  onReject,
  onDelete,
  onPreviewPdf,
  onOpenDetail,
  emptyMessage,
}: Props) {
  if (quotes.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-xl p-10 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          {emptyMessage ?? "Aucun devis a afficher."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => {
        const clientName =
          quote.clientFirstName || quote.clientLastName
            ? `${quote.clientFirstName ?? ""} ${quote.clientLastName ?? ""}`.trim()
            : null;
        const projectLabel = quote.projectName
          ? quote.projectName
          : `Projet #${quote.projectId}`;

        return (
          <div
            key={quote.id}
            className={`bg-white border border-slate-200 rounded-xl p-5 transition-all hover:shadow-md hover:border-slate-300 ${
              onOpenDetail ? "cursor-pointer" : ""
            }`}
            onClick={(e) => {
              if (!onOpenDetail) return;
              if ((e.target as HTMLElement).closest("button")) return;
              onOpenDetail(quote);
            }}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-2">
                  <p className="font-semibold text-secondary">{quote.quoteNumber}</p>
                  <QuoteStatusBadge status={quote.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {projectLabel}
                  </span>
                  {clientName && (
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {clientName}
                    </span>
                  )}
                  {role === "ADMIN" && quote.installerId && (
                    <span className="inline-flex items-center gap-1">
                      <Hammer className="w-3.5 h-3.5" />
                      {quote.installerId.slice(0, 8)}
                    </span>
                  )}
                </div>

                {quote.description && (
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{quote.description}</p>
                )}

                <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 rounded-lg p-3 mt-3">
                  <div>
                    <span className="text-slate-500 block">Main d'oeuvre</span>
                    <span className="font-medium text-secondary">
                      {money(quote.laborCost)} TND
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Materiaux</span>
                    <span className="font-medium text-secondary">
                      {money(quote.materialsCost)} TND
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total</span>
                    <span className="font-bold text-primary text-sm">
                      {money(quote.totalAmount)} TND
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-col gap-2 md:w-44 md:shrink-0">
                {role !== "CLIENT" && quote.status === "DRAFT" && onSend && (
                  <button
                    type="button"
                    onClick={() => onSend(quote.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer
                  </button>
                )}

                {role === "CLIENT" && quote.status === "SENT" && onAccept && (
                  <button
                    type="button"
                    onClick={() => onAccept(quote.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accepter
                  </button>
                )}
                {role === "CLIENT" && quote.status === "SENT" && onReject && (
                  <button
                    type="button"
                    onClick={() => onReject(quote)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 text-sm rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </button>
                )}

                {role === "CLIENT" && onOpenDetail && (
                  <button
                    type="button"
                    onClick={() => onOpenDetail(quote)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Voir détail
                  </button>
                )}

                {onPreviewPdf && (
                  <button
                    type="button"
                    onClick={() => onPreviewPdf(quote)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
                    title={role === "CLIENT" ? "Telecharger PDF" : "Imprimer PDF"}
                  >
                    {role === "CLIENT" ? (
                      <>
                        <Download className="w-4 h-4" />
                        PDF
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Apercu
                      </>
                    )}
                  </button>
                )}

                {role !== "CLIENT" && quote.status === "DRAFT" && onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(quote.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-600 text-sm rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
