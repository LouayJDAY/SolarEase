import React, { useEffect, useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  initialNote?: string;
  processing?: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

export function AskCompletionModal({ open, initialNote = "", processing = false, onClose, onConfirm }: Props) {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (open) setNote(initialNote);
  }, [open, initialNote]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-secondary flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Demander un complément
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Précisez les informations manquantes. Le client recevra une notification avec ce message.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex : merci de préciser la surface exacte de toiture et la facture annuelle."
            rows={5}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>

        <footer className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note.trim())}
            disabled={processing || note.trim().length === 0}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Envoyer la demande
          </button>
        </footer>
      </div>
    </div>
  );
}
