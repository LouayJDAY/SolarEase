import React, { useEffect, useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import equipmentService, { EquipmentResponse } from "../services/equipmentService";
import { equipmentCreateSchema } from "../validation/commerceSchemas";
import { EquipmentImage } from "./EquipmentImage";
import {
  TYPE_OPTIONS,
  buildEquipmentPayload,
  formFromEquipment,
  parsePower,
} from "../utils/equipmentFormUtils";
import toast from "react-hot-toast";

interface AddEquipmentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  equipment?: EquipmentResponse | null;
}

export function AddEquipmentModal({
  onClose,
  onSuccess,
  equipment,
}: AddEquipmentModalProps) {
  const isEdit = Boolean(equipment?.id);
  const [form, setForm] = useState({
    name: "",
    typeLabel: "",
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
  const [imageUrl, setImageUrl] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!equipment) return;
    setForm(formFromEquipment(equipment));
    setImageUrl(equipment.imageUrl ?? "");
    setPhotoPreview("");
  }, [equipment]);

  const set = (key: string, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handlePhotoSelect = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop lourde (max 5 Mo)");
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    setError("");
    try {
      const uploaded = await equipmentService.uploadPhoto(file);
      setImageUrl(uploaded.imageUrl);
    } catch {
      setError("Impossible d'envoyer l'image");
      setPhotoPreview("");
      setImageUrl(equipment?.imageUrl ?? "");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const selected = TYPE_OPTIONS.find((t) => t.label === form.typeLabel);
    const nominalPower = parsePower(form.power);
    const parsed = equipmentCreateSchema.safeParse({
      name: form.name,
      type: selected?.value || "SOLAR_PANEL",
      brand: form.brand || undefined,
      nominalPower,
      price: form.price || undefined,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path?.[0];
      const msg =
        field === "nominalPower"
          ? "Puissance invalide (ex. 2000W ou 3.5kW)."
          : field === "price"
            ? "Prix invalide."
            : issue?.message ?? "Données invalides.";
      setError(msg);
      return;
    }

    let payload;
    try {
      payload = buildEquipmentPayload({ ...form, imageUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Données invalides.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && equipment) {
        await equipmentService.update(equipment.id, payload);
        toast.success("Équipement modifié");
      } else {
        await equipmentService.create(payload);
        toast.success("Équipement ajouté");
      }
      onSuccess?.();
      onClose();
    } catch {
      setError(
        isEdit
          ? "Erreur lors de la modification de l'équipement"
          : "Erreur lors de l'ajout de l'équipement"
      );
    } finally {
      setSaving(false);
    }
  };

  const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";
  const inputCls =
    "w-full h-11 px-3.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto mx-4"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "Modifier l'équipement" : "Ajouter un équipement"}
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-7 py-5 space-y-5">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.typeLabel}
                onChange={(e) => set("typeLabel", e.target.value)}
                className={`${inputCls} appearance-none`}
              >
                <option value="">Sélectionner un type</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.label} value={t.label}>
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

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Description technique de l'équipement..."
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Puissance / Capacité</label>
              <input
                value={form.power}
                onChange={(e) => set("power", e.target.value)}
                placeholder="Ex: 545W ou 5kW"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Prix unitaire (TND) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0.01}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="Ex: 580"
                  className={`${inputCls} pr-14`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
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
                placeholder="Ex: 25"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Image du produit</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handlePhotoSelect(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center hover:border-[#4CAF50]/40 hover:bg-green-50/30 transition-colors disabled:opacity-60"
            >
              {photoPreview || imageUrl ? (
                <div className="w-full max-w-[220px] h-36 rounded-lg overflow-hidden mb-2">
                  <EquipmentImage
                    imageUrl={imageUrl || photoPreview}
                    type={TYPE_OPTIONS.find((t) => t.label === form.typeLabel)?.value}
                    alt="Aperçu"
                    className="w-full h-full object-contain"
                    containerClassName="h-36 bg-gray-50"
                  />
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-[#E8F5E9]">
                    <Upload className="w-5 h-5 text-[#4CAF50]" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Cliquez pour choisir une image
                  </p>
                </>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {uploadingPhoto ? "Envoi en cours…" : "PNG, JPG jusqu'à 5 MB"}
              </p>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          {error && <p className="text-sm text-red-500 mr-auto">{error}</p>}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "#4CAF50" }}
          >
            {saving ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter l'équipement"}
          </button>
        </div>
      </form>
    </div>
  );
}
