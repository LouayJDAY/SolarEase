import React from "react";
import { createPortal } from "react-dom";
import { X, User, MapPin, DollarSign } from "lucide-react";
import { ProjectRequest, ProjectResponse } from "../services/projectService";
import authService, { InstallerOption } from "../services/authService";
import { LocationPicker, LocationValue } from "./LocationPicker";
import { LocationMap } from "./LocationMap";
import { isValidProjectCoordinates } from "../utils/geo";
import { projectCreateSchema } from "../validation/projectSchemas";
import { zodFieldErrors } from "../validation/common";

interface EditProjectModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  project: ProjectResponse | null;
  onClose: () => void;
  onSubmit: (data: ProjectRequest) => Promise<boolean | void> | boolean | void;
}

function FormSection({
  title,
  description,
  icon: Icon,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-secondary">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

export function EditProjectModal({ isOpen, isAdmin, project, onClose, onSubmit }: EditProjectModalProps) {
  const [formData, setFormData] = React.useState<ProjectRequest>({
    name: "",
    description: "",
    location: "",
    latitude: 0,
    longitude: 0,
    peakPower: 0,
    availableArea: 0,
    inclination: 35,
    orientation: 0,
    budget: 0,
    clientId: undefined,
    installerId: "",
    installerEmail: "",
  });
  const [locationGeo, setLocationGeo] = React.useState<LocationValue>({
    location: "",
    latitude: null,
    longitude: null,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [locationError, setLocationError] = React.useState("");
  const [installers, setInstallers] = React.useState<InstallerOption[]>([]);
  const [loadingInstallers, setLoadingInstallers] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !project) return;
    setError("");
    setLocationError("");
    const lat = isValidProjectCoordinates(project.latitude, project.longitude)
      ? project.latitude!
      : null;
    const lon = isValidProjectCoordinates(project.latitude, project.longitude)
      ? project.longitude!
      : null;
    setLocationGeo({
      location: project.location || "",
      latitude: lat,
      longitude: lon,
    });
    setFormData({
      name: project.name,
      description: project.description || "",
      location: project.location || "",
      latitude: lat ?? 0,
      longitude: lon ?? 0,
      peakPower: project.peakPower || 0,
      availableArea: project.availableArea || 0,
      inclination: project.inclination ?? 35,
      orientation: project.orientation ?? 0,
      budget: project.budget || 0,
      clientId: project.client?.id,
      installerId: project.installerId || "",
      installerEmail: project.installerEmail || "",
    });
  }, [isOpen, project]);

  React.useEffect(() => {
    if (!isOpen || !isAdmin) return;
    setLoadingInstallers(true);
    authService
      .getInstallers()
      .then(setInstallers)
      .catch(() => setInstallers([]))
      .finally(() => setLoadingInstallers(false));
  }, [isOpen, isAdmin]);

  React.useEffect(() => {
    if (!isOpen) return;
    document.body.setAttribute("data-leaflet-modal-open", "true");
    return () => document.body.removeAttribute("data-leaflet-modal-open");
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setLocationError("");

    if (!isValidProjectCoordinates(locationGeo.latitude, locationGeo.longitude)) {
      setLocationError("Sélectionnez l'emplacement du site sur la carte.");
      setSubmitting(false);
      return;
    }

    const parsed = projectCreateSchema.safeParse({
      name: formData.name.trim(),
      clientId: project.client?.id ?? 0,
      latitude: locationGeo.latitude,
      longitude: locationGeo.longitude,
      availableArea: formData.availableArea && formData.availableArea > 0 ? formData.availableArea : undefined,
      inclination: formData.inclination ?? undefined,
      orientation: formData.orientation ?? undefined,
      budget: formData.budget && formData.budget > 0 ? formData.budget : undefined,
    });
    if (!parsed.success) {
      const zErr = zodFieldErrors(parsed.error);
      setError(zErr.name || Object.values(zErr).join(" ") || "Données invalides.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        location: locationGeo.location,
        latitude: locationGeo.latitude!,
        longitude: locationGeo.longitude!,
        clientId: project.client?.id,
        installerId: isAdmin ? formData.installerId?.trim() || undefined : project.installerId,
        installerEmail: isAdmin ? formData.installerEmail?.trim() || undefined : project.installerEmail,
      } as unknown as ProjectRequest;

      const result = await onSubmit(payload);

      if (result === false) {
        setError("Impossible de sauvegarder le projet.");
        return;
      }

      onClose();
    } catch {
      setError("Impossible de sauvegarder le projet.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative isolate bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        data-leaflet-modal="true"
      >
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-secondary">Modifier le projet</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="modal-map-pin px-6 pt-4 pb-3 border-b border-gray-100 space-y-3">
          <LocationPicker
            value={locationGeo}
            onChange={setLocationGeo}
            error={locationError || undefined}
            compact
            mapDetached
            showStatus={false}
          />
          <LocationMap
            value={locationGeo}
            onChange={setLocationGeo}
            compact
            modal
            active={isOpen}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="modal-body-scroll flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Nom</span>
              <input
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Description</span>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </label>
          </div>

          <FormSection
            title="Site & dimensionnement"
            description="Paramètres du toit utilisés pour le calcul PVGIS."
            icon={MapPin}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-secondary mb-2">Surface (m²)</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                  value={formData.availableArea || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, availableArea: Number(e.target.value) || 0 })
                  }
                  placeholder="Ex: 25"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="block text-sm font-medium text-secondary mb-2">
                  Inclinaison ({formData.inclination ?? 35}°)
                </span>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={formData.inclination ?? 35}
                  onChange={(e) =>
                    setFormData({ ...formData, inclination: Number(e.target.value) })
                  }
                  className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">0° = plat, 35° = optimal Tunisie</p>
              </label>
            </div>

            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Orientation (°)</span>
              <input
                type="number"
                min="-180"
                max="180"
                className="w-full max-w-xs px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                value={formData.orientation ?? 0}
                onChange={(e) =>
                  setFormData({ ...formData, orientation: Number(e.target.value) })
                }
                placeholder="0 = Sud"
              />
              <p className="text-xs text-muted-foreground mt-1">0° = Sud, 90° = Ouest, -90° = Est</p>
            </label>
          </FormSection>

          <FormSection
            title="Informations commerciales"
            description="Contraintes client — la puissance crête est calculée par le dimensionnement."
            icon={DollarSign}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-secondary mb-2">Puissance crête (kWc)</span>
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-muted-foreground cursor-not-allowed"
                  value={
                    formData.peakPower && formData.peakPower > 0
                      ? `${formData.peakPower} kWc`
                      : "— (après dimensionnement)"
                  }
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-secondary mb-2">Budget estimé (TND)</span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                  value={formData.budget || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: Number(e.target.value) || 0 })
                  }
                  placeholder="Ex: 12500"
                />
              </label>
            </div>
          </FormSection>

          {isAdmin && (
            <FormSection
              title="Réaffectation installateur"
              description="Réservé à l'administrateur."
              icon={User}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block md:col-span-2">
                  <span className="block text-sm font-medium text-secondary mb-2">Installateur</span>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                    value={formData.installerId || ""}
                    onChange={(e) => {
                      const selected = installers.find((installer) => installer.uuid === e.target.value);
                      setFormData({
                        ...formData,
                        installerId: e.target.value,
                        installerEmail: selected?.email || "",
                      });
                    }}
                    disabled={loadingInstallers}
                  >
                    <option value="">
                      {loadingInstallers ? "Chargement..." : "Sélectionner un installateur"}
                    </option>
                    {installers.map((installer) => (
                      <option key={installer.uuid} value={installer.uuid}>
                        {installer.firstName} {installer.lastName} — {installer.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-secondary mb-2">E-mail installateur</span>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100"
                    value={formData.installerEmail || ""}
                    readOnly
                  />
                </label>
              </div>
            </FormSection>
          )}

          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 text-secondary hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
