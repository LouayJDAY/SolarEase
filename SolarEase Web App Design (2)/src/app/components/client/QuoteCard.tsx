import React from "react";
import { CheckCircle, XCircle, FileText, Clock } from "lucide-react";
import quoteService from "../../services/quoteService";
import { QuoteStatusBadge } from "../QuoteStatusBadge";
import type { Quote } from "../../services/quoteService";

interface Props {
  quote: Quote;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}

export function QuoteCard({ quote, onAccept, onReject }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-secondary">{quote.quoteNumber}</p>
              <p className="text-sm text-gray-500">
                Projet #{quote.projectId}
              </p>
            </div>
          </div>
          <QuoteStatusBadge status={quote.status} />
        </div>
      </div>

      <div className="p-5">
        {quote.description && (
          <p className="text-sm text-gray-600 mb-4">{quote.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Main d'œuvre</p>
            <p className="font-medium text-secondary">
              {quote.laborCost.toLocaleString()} TND
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Matériaux</p>
            <p className="font-medium text-secondary">
              {quote.materialsCost.toLocaleString()} TND
            </p>
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total TTC</span>
            <span className="text-xl font-bold text-primary">
              {quote.totalAmount.toLocaleString()} TND
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <Clock className="w-4 h-4" />
          <span>
            Valide jusqu'au{" "}
            {new Date(quote.validUntil).toLocaleDateString("fr-TN")}
          </span>
        </div>

        {quote.status === "SENT" && (
          <div className="flex gap-3">
            <button
              onClick={() => onAccept(quote.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Accepter
            </button>
            <button
              onClick={() => onReject(quote.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
            >
              <XCircle className="w-4 h-4" />
              Refuser
            </button>
          </div>
        )}

        <div className="mt-3">
          <button
            onClick={() => quoteService.previewQuotePdf(quote)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-secondary hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Voir PDF
          </button>
        </div>

        {quote.status === "ACCEPTED" && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Devis accepté – facture générée automatiquement
          </div>
        )}

        {quote.status === "REJECTED" && (
          <div className="text-sm text-red-600">
            <span className="font-medium">Refusé</span>
            {quote.rejectionReason && (
              <span className="text-gray-500"> — {quote.rejectionReason}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
