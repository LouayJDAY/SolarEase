import React, { useEffect, useState } from "react";
import { X, MapPin, DollarSign, User } from "lucide-react";
import clientService, { ClientResponse } from "../services/clientService";

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
    peakPower: "",
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError("");
      setClientsError("");
      setFieldErrors({ name: "", client: "", location: "", peakPower: "" });
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
    const nextErrors = {
      name: formData.name.trim() ? "" : "Le nom du projet est requis.",
      client: formData.client ? "" : "Veuillez sélectionner un client.",
      location: formData.location.trim() ? "" : "La localisation est requise.",
      peakPower: "",
    };

    const peakPower = parseFloat(formData.peakPower);
    if (!formData.peakPower.trim()) {
      nextErrors.peakPower = "La puissance crête est requise.";
    } else if (Number.isNaN(peakPower) || peakPower <= 0) {
      nextErrors.peakPower = "La puissance doit être supérieure à 0.";
    }

    setFieldErrors(nextErrors);
    return !nextErrors.name && !nextErrors.client && !nextErrors.location && !nextErrors.peakPower;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError("");
    if (!validate()) return;

    const payload = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      latitude: formData.latitude.trim(),
      longitude: formData.longitude.trim(),
      peakPower: formData.peakPower.trim(),
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
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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

          {/* Client & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Localisation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                    fieldErrors.location ? "border-red-400" : "border-gray-300"
                  }`}
                  placeholder="Ex: Tunis, Tunisie"
                />
              </div>
              {fieldErrors.location && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.location}</p>
              )}
            </div>
          </div>

          {/* Latitude & Longitude */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Ex: 36.8065"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Ex: 10.1815"
              />
            </div>
          </div>

          {/* Peak Power & Available Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Puissance crête (kWc) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.peakPower}
                onChange={(e) =>
                  setFormData({ ...formData, peakPower: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                  fieldErrors.peakPower ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="Ex: 3.5"
              />
              {fieldErrors.peakPower && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.peakPower}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Surface disponible (m²)
              </label>
              <input
                type="number"
                step="1"
                value={formData.availableArea}
                onChange={(e) =>
                  setFormData({ ...formData, availableArea: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Ex: 25"
              />
            </div>
          </div>

          {/* Inclination & Orientation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Inclinaison (°)
              </label>
              <div className="space-y-2">
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
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={formData.inclination}
                  onChange={(e) =>
                    setFormData({ ...formData, inclination: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="0 = Sud"
              />
              <p className="text-xs text-muted-foreground mt-1">
                0° = Sud, 90° = Ouest, -90° = Est
              </p>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Budget estimé (TND)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                step="100"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                placeholder="Ex: 12500"
              />
            </div>
          </div>

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
