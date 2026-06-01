import React, { useState } from "react";
import { XCircle, X } from "lucide-react";

interface Props {
  quoteNumber: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function QuoteRejectModal({
  quoteNumber,
  onConfirm,
  onClose,
  isLoading,
}: Props) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-secondary">Refuser le devis</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-secondary">Devis {quoteNumber}</p>
              <p className="text-sm text-gray-500">
                Cette action enverra une notification à l'installateur
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-secondary mb-2">
              Motif du refus (optionnel)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Expliquez pourquoi vous refusez ce devis..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Traitement..." : "Confirmer le refus"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
