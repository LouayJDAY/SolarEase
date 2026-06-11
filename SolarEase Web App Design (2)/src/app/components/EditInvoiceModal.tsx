import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../services/api";
import { invoiceUpdateSchema } from "../validation/commerceSchemas";
import { getApiErrorMessage } from "../utils/apiError";

export interface InvoiceEditData {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  subtotal?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  status: string;
  notes?: string | null;
}

interface EditInvoiceModalProps {
  invoice: InvoiceEditData | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditInvoiceModal({ invoice, onClose, onSaved }: EditInvoiceModalProps) {
  const [form, setForm] = useState({
    date: "",
    dueDate: "",
    subtotal: "",
    discountPercent: "",
    discountAmount: "",
    notes: "",
    status: "DRAFT",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invoice) return;
    setForm({
      date: invoice.date?.slice(0, 10) || "",
      dueDate: invoice.dueDate?.slice(0, 10) || "",
      subtotal: String(invoice.subtotal ?? invoice.amount ?? ""),
      discountPercent: String(invoice.discountPercent ?? 0),
      discountAmount: String(invoice.discountAmount ?? 0),
      notes: invoice.notes || "",
      status: invoice.status || "DRAFT",
    });
    setError("");
  }, [invoice]);

  const computedNet = () => {
    const sub = parseFloat(form.subtotal) || 0;
    const pct = parseFloat(form.discountPercent) || 0;
    const fixed = parseFloat(form.discountAmount) || 0;
    const fromPct = sub * (pct / 100);
    return Math.max(0, sub - fromPct - fixed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    const parsed = invoiceUpdateSchema.safeParse({
      date: form.date,
      dueDate: form.dueDate,
      subtotal: form.subtotal,
      discountPercent: form.discountPercent || undefined,
      discountAmount: form.discountAmount || undefined,
      status: form.status,
      notes: form.notes,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Données invalides.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.put(`/invoices/${invoice.id}`, {
        date: parsed.data.date,
        dueDate: parsed.data.dueDate,
        subtotal: parsed.data.subtotal,
        discountPercent: parsed.data.discountPercent ?? 0,
        discountAmount: parsed.data.discountAmount ?? 0,
        notes: parsed.data.notes,
        status: parsed.data.status,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Modifier {invoice.number}</h2>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Échéance</label>
            <input
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium">Sous-total (TND)</label>
          <input
            type="number"
            step="0.01"
            required
            value={form.subtotal}
            onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Remise (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.discountPercent}
              onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Remise fixe (TND)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.discountAmount}
              onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Montant net : <strong>{computedNet().toFixed(2)} TND</strong>
        </p>
        <div>
          <label className="text-xs font-medium">Statut</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
          >
            <option value="DRAFT">Brouillon</option>
            <option value="SENT">Envoyée</option>
            <option value="PAID">Payée</option>
            <option value="OVERDUE">En retard</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
