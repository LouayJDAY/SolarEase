import React, { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { quoteRejectSchema } from "../validation/commerceSchemas";

interface Props {
  open: boolean;
  quoteNumber?: string;
  totalAmount?: number;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

const presetReasons = [
  "Prix trop eleve",
  "Delai trop long",
  "Equipement non conforme",
  "Autre devis preferé",
  "Conditions de paiement",
];

export function QuoteRejectModal({ open, quoteNumber, totalAmount, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleTogglePreset = (preset: string) => {
    setReason((prev) => {
      if (prev === preset) return "";
      return preset;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = quoteRejectSchema.safeParse({ rejectionReason: reason.trim() });
    if (!parsed.success) {
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(parsed.data.rejectionReason ?? "");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-secondary">Refuser le devis</h2>
              {quoteNumber && (
                <p className="text-xs text-slate-500">
                  {quoteNumber}
                  {typeof totalAmount === "number" && (
                    <>
                      {" • "}
                      <span className="font-medium">
                        {new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(totalAmount)} TND
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-2">Choisissez une raison ou expliquez :</p>
            <div className="flex flex-wrap gap-2">
              {presetReasons.map((preset) => {
                const active = reason === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleTogglePreset(preset)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              Commentaire <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Donnez plus de details a l'installateur..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Refus en cours..." : "Refuser le devis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
