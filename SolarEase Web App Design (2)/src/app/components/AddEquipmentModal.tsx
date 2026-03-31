import React, { useState } from "react";
import { X, Upload } from "lucide-react";
import equipmentService, { EquipmentRequest } from "../services/equipmentService";

interface AddEquipmentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const typeOptions: { label: string; value: EquipmentRequest["type"] }[] = [
  { label: "Panneau Solaire", value: "PANEL" },
  { label: "Onduleur", value: "INVERTER" },
  { label: "Batterie", value: "BATTERY" },
  { label: "Structure de Montage", value: "MOUNTING" },
  { label: "Câble", value: "CABLE" },
  { label: "Protection", value: "PROTECTION" },
];

export function AddEquipmentModal({ onClose, onSuccess }: AddEquipmentModalProps) {
  const [form, setForm] = useState({
    name: "",
    type: "" as string,
    brand: "",
    description: "",
    power: "",
    efficiency: "",
    price: "",
    warranty: "",
    dimensions: "",
    weight: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const data: EquipmentRequest = {
        name: form.name,
        brand: form.brand,
        type: form.type as EquipmentRequest["type"],
        power: form.power || undefined,
        efficiency: form.efficiency || undefined,
        price: form.price ? parseFloat(form.price) : 0,
        warranty: form.warranty || undefined,
        description: form.description || undefined,
      };
      await equipmentService.create(data);
      onSuccess?.();
      onClose();
    } catch {
      setError("Erreur lors de l'ajout de l'équipement");
    } finally {
      setSaving(false);
    }
  };

  /* ── Shared styles ─────────────────────────────────────────── */
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";
  const inputCls =
    "w-full h-11 px-3.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto mx-4"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            Ajouter un Équipement
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-7 py-5 space-y-5">
          {/* Row 1 – Name */}
          <div>
            <label className={labelCls}>
              Nom de l'équipement <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex: JA Solar JAM72S30-545/MR"
              className={inputCls}
            />
          </div>

          {/* Row 2 – Type + Brand */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className={`${inputCls} appearance-none`}
              >
                <option value="">Sélectionner un type</option>
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Marque</label>
              <input
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                placeholder="Ex: JA Solar"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 3 – Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Description technique de l'équipement..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] transition-colors resize-none"
            />
          </div>

          {/* Row 4 – Power + Efficiency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Puissance / Capacité</label>
              <input
                value={form.power}
                onChange={(e) => set("power", e.target.value)}
                placeholder="Ex: 545W"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Rendement / Efficacité</label>
              <input
                value={form.efficiency}
                onChange={(e) => set("efficiency", e.target.value)}
                placeholder="Ex: 21.3%"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 5 – Price + Warranty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Prix unitaire (TND)</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0"
                  className={`${inputCls} pr-14`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                  TND
                </span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Garantie (années)</label>
              <input
                type="number"
                value={form.warranty}
                onChange={(e) => set("warranty", e.target.value)}
                placeholder="Ex: 12"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 6 – Dimensions + Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dimensions</label>
              <input
                value={form.dimensions}
                onChange={(e) => set("dimensions", e.target.value)}
                placeholder="L × l × H mm"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Poids (kg)</label>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => set("weight", e.target.value)}
                placeholder="Ex: 28.9"
                className={inputCls}
              />
            </div>
          </div>

          {/* Row 7 – Image upload */}
          <div>
            <label className={labelCls}>Image du produit</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#4CAF50]/40 hover:bg-green-50/30 transition-colors">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: "#E8F5E9" }}
              >
                <Upload className="w-5 h-5" style={{ color: "#4CAF50" }} />
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Glissez une image ou{" "}
                <span style={{ color: "#4CAF50" }}>cliquez pour parcourir</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG jusqu'à 5 MB
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          {error && <p className="text-sm text-red-500 mr-auto">{error}</p>}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
            style={{ backgroundColor: "#4CAF50" }}
          >
            {saving ? "Ajout..." : "Ajouter l'équipement"}
          </button>
        </div>
      </form>
    </div>
  );
}
