import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { InstallerOption } from "../services/authService";
import { createInstallerSchema } from "../validation/authSchemas";
import { z } from "zod";

const updateInstallerSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
  email: z.string().trim().email("Email invalide."),
  phone: z.string().trim().optional(),
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, "Minimum 8 caractères."),
  isActive: z.boolean(),
});

export interface InstallerFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
}

interface Props {
  isOpen: boolean;
  installer: InstallerOption | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: InstallerFormValues) => Promise<void>;
}

const emptyForm: InstallerFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
};

export function InstallerFormModal({
  isOpen,
  installer,
  saving = false,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<InstallerFormValues>(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (installer) {
      setForm({
        firstName: installer.firstName || "",
        lastName: installer.lastName || "",
        email: installer.email || "",
        phone: installer.phone || "",
        password: "",
        isActive: installer.isActive,
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen, installer]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = installer ? updateInstallerSchema : createInstallerSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Données invalides.");
      return;
    }
    setError("");
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {installer ? "Modifier l'installateur" : "Ajouter un installateur"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                value={form.firstName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, firstName: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                value={form.lastName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lastName: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+216 XX XXX XXX"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {installer ? "Nouveau mot de passe (optionnel)" : "Mot de passe *"}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder={installer ? "Laisser vide pour conserver" : "Minimum 8 caractères"}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] outline-none"
            />
          </div>

          {installer && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isActive: e.target.checked }))
                }
                className="rounded border-gray-300"
              />
              Compte actif
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: "#4CAF50" }}
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
