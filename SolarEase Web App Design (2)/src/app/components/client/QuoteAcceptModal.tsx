import React from "react";
import { CheckCircle, X } from "lucide-react";

interface Props {
  quoteNumber: string;
  totalAmount: number;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function QuoteAcceptModal({
  quoteNumber,
  totalAmount,
  onConfirm,
  onClose,
  isLoading,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-secondary">Confirmer l'acceptation</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-secondary">Devis {quoteNumber}</p>
              <p className="text-sm text-gray-500">
                Montant total : {totalAmount.toLocaleString()} TND
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            En acceptant ce devis, vous confirmez votre accord avec les conditions
            proposées. Une facture sera automatiquement générée.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Traitement..." : "Confirmer l'acceptation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
