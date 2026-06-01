import React, { useState, useEffect } from "react";

interface Props {
  open: boolean;
  initialReason?: string;
  processing?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function RejectModal({ open, initialReason = "", processing = false, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState(initialReason);

  useEffect(() => {
    if (open) setReason(initialReason);
  }, [open, initialReason]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-[90%] max-w-md p-6">
        <h3 className="text-lg font-semibold mb-2">Motif du refus</h3>
        <textarea
          className="w-full border rounded-md p-2 min-h-[100px] mb-4"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Expliquez pourquoi la demande est rejetée"
        />
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-lg border" onClick={onClose} disabled={processing}>
            Annuler
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white"
            onClick={() => onConfirm(reason)}
            disabled={processing || reason.trim().length === 0}
          >
            {processing ? "…" : "Confirmer le rejet"}
          </button>
        </div>
      </div>
    </div>
  );
}
