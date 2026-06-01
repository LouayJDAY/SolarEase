import React from "react";
import { X, MapPin, User } from "lucide-react";
import { ProjectRequest, ProjectResponse } from "../services/projectService";
import authService, { InstallerOption } from "../services/authService";

interface EditProjectModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  project: ProjectResponse | null;
  onClose: () => void;
  onSubmit: (data: ProjectRequest) => Promise<boolean | void> | boolean | void;
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
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [installers, setInstallers] = React.useState<InstallerOption[]>([]);
  const [loadingInstallers, setLoadingInstallers] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !project) return;
    setError("");
    setFormData({
      name: project.name,
      description: project.description || "",
      location: project.location || "",
      latitude: project.latitude || 0,
      longitude: project.longitude || 0,
      peakPower: project.peakPower || 0,
      availableArea: project.availableArea || 0,
      inclination: project.inclination || 35,
      orientation: project.orientation || 0,
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

  if (!isOpen || !project) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...formData,
        clientId: project.client?.id,
        installerId: isAdmin ? formData.installerId?.trim() || undefined : project.installerId,
        installerEmail: isAdmin ? formData.installerEmail?.trim() || undefined : project.installerEmail,
      } as unknown as any;

      console.debug("EditProjectModal submit payload:", payload);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-secondary">Modifier le projet</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Nom</span>
              <input
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Localisation</span>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-secondary mb-2">Description</span>
            <textarea
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Latitude</span>
              <input type="number" step="0.0001" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Longitude</span>
              <input type="number" step="0.0001" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Puissance (kWc)</span>
              <input type="number" step="0.1" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" value={formData.peakPower} onChange={(e) => setFormData({ ...formData, peakPower: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-secondary mb-2">Budget</span>
              <input type="number" step="0.1" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })} />
            </label>
          </div>

          {isAdmin && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                <User className="w-4 h-4 text-primary" />
                Réaffectation installateur
              </div>
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
                    <option value="">{loadingInstallers ? "Chargement des installateurs..." : "Sélectionner un installateur"}</option>
                    {installers.map((installer) => (
                      <option key={installer.uuid} value={installer.uuid}>
                        {installer.firstName} {installer.lastName} — {installer.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-secondary mb-2">Installer email</span>
                  <input
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    value={formData.installerEmail || ""}
                    placeholder="installer@solarease.com"
                    readOnly
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 text-secondary hover:bg-gray-50 transition-colors">Annuler</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-60">
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}