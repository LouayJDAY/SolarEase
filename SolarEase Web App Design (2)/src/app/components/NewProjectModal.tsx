import React, { useEffect, useState } from "react";
import { X, DollarSign, User, MapPin } from "lucide-react";
import clientService, { ClientResponse } from "../services/clientService";
import { LocationPicker, LocationValue } from "./LocationPicker";
import { isValidProjectCoordinates } from "../utils/geo";
import { projectCreateSchema } from "../validation/projectSchemas";
import { zodFieldErrors } from "../validation/common";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean | void> | boolean | void;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: NewProjectModalProps) {
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    client: "",
    location: "",
    latitude: "",
    longitude: "",
    peakPower: "",
    availableArea: "",
    inclination: "35",
    orientation: "0",
    budget: "",
  });

  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [clientsError, setClientsError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    client: "",
    location: "",
  });
  const [locationGeo, setLocationGeo] = useState<LocationValue>({
    location: "",
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError("");
      setClientsError("");
      setFieldErrors({ name: "", client: "", location: "" });
      setLocationGeo({ location: "", latitude: null, longitude: null });
      setIsLoadingClients(true);

      clientService
        .getClients({ size: 200 })
        .then((page) => setClients(page.content))
        .catch(() => {
          setClientsError("Impossible de charger la liste des clients.");
          setClients([]);
        })
        .finally(() => setIsLoadingClients(false));
    }
  }, [isOpen]);

  const validate = () => {
    const locationOk =
      locationGeo.location.trim().length > 0 &&
      isValidProjectCoordinates(locationGeo.latitude, locationGeo.longitude);

    if (!locationOk) {
      setFieldErrors({
        name: formData.name.trim() ? "" : "Le nom du projet est requis.",
        client: formData.client ? "" : "Veuillez sélectionner un client.",
        location: "Sélectionnez l'emplacement du site sur la carte (requis pour PVGIS).",
      });
      return false;
    }

    const parsed = projectCreateSchema.safeParse({
      name: formData.name.trim(),
      clientId: formData.client,
      latitude: locationGeo.latitude,
      longitude: locationGeo.longitude,
      availableArea: formData.availableArea.trim() || undefined,
      inclination: formData.inclination.trim() || undefined,
      orientation: formData.orientation.trim() || undefined,
      budget: formData.budget.trim() || undefined,
    });

    if (!parsed.success) {
      const zErr = zodFieldErrors(parsed.error);
      setFieldErrors({
        name: zErr.name || (formData.name.trim() ? "" : "Le nom du projet est requis."),
        client: zErr.clientId || (formData.client ? "" : "Veuillez sélectionner un client."),
        location: zErr.latitude || zErr.longitude || "",
      });
      return false;
    }

    setFieldErrors({ name: "", client: "", location: "" });
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError("");
    if (!validate()) return;

    const payload = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      location: locationGeo.location.trim(),
      latitude: String(locationGeo.latitude ?? ""),
      longitude: String(locationGeo.longitude ?? ""),
      peakPower: formData.peakPower.trim() || "0",
      availableArea: formData.availableArea.trim(),
      budget: formData.budget.trim(),
    };

    try {
      setIsSubmitting(true);
      const result = await onSubmit(payload);

      if (result === false) {
        setSubmitError("Impossible de créer le projet. Veuillez réessayer.");
        return;
      }

      onClose();
      setLocationGeo({ location: "", latitude: null, longitude: null });
      setFormData({
        name: "",
        description: "",
        client: "",
        location: "",
        latitude: "",
        longitude: "",
        peakPower: "",
        availableArea: "",
        inclination: "35",
        orientation: "0",
        budget: "",
      });
    } catch {
      setSubmitError("Impossible de créer le projet. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-secondary">
            Nouveau Projet
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}

          {/* Project Name - Full Width */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                fieldErrors.name ? "border-red-400" : "border-gray-300"
              }`}
              placeholder="Ex: Installation PV Résidentielle"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Description - Full Width */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
              placeholder="Description du projet..."
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                required
                value={formData.client}
                onChange={(e) =>
                  setFormData({ ...formData, client: e.target.value })
                }
                disabled={isLoadingClients}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors appearance-none bg-white disabled:bg-slate-100 ${
                  fieldErrors.client ? "border-red-400" : "border-gray-300"
                }`}
              >
                <option value="">
                  {isLoadingClients ? "Chargement des clients..." : "Sélectionner un client"}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
            {fieldErrors.client && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.client}</p>
            )}
            {clientsError && (
              <p className="mt-1 text-xs text-red-600">{clientsError}</p>
            )}
          </div>

          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-secondary">Site & dimensionnement</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Emplacement météo PVGIS et paramètres du toit.
                </p>
              </div>
            </div>

            <LocationPicker
              value={locationGeo}
              onChange={setLocationGeo}
              error={fieldErrors.location || undefined}
              compact
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Surface disponible (m²)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={formData.availableArea}
                  onChange={(e) =>
                    setFormData({ ...formData, availableArea: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                  placeholder="Ex: 25"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary mb-2">
                  Inclinaison ({formData.inclination}°)
                </label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={formData.inclination}
                  onChange={(e) =>
                    setFormData({ ...formData, inclination: e.target.value })
                  }
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Orientation (°)
              </label>
              <input
                type="number"
                min="-180"
                max="180"
                value={formData.orientation}
                onChange={(e) =>
                  setFormData({ ...formData, orientation: e.target.value })
                }
                className="w-full max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                placeholder="0 = Sud"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0° = Sud, 90° = Ouest, -90° = Est
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-secondary">Informations commerciales</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Budget client — la puissance sera calculée au dimensionnement.
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Budget estimé (TND)
              </label>
              <div className="relative max-w-sm">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                  placeholder="Ex: 12500"
                />
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-gray-300 text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Création en cours..." : "Créer le projet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
