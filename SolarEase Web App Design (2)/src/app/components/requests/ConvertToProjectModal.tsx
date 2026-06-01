import React, { useEffect, useMemo, useState } from "react";
import { X, Search, UserPlus, FolderKanban, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import clientService, { ClientResponse } from "../../services/clientService";
import demandService, { Demand } from "../../services/demandService";

interface Props {
  open: boolean;
  demand: Demand | null;
  onClose: () => void;
  /** Receives the freshly-created project id so the parent can refresh / navigate. */
  onConverted: (projectId: number) => void;
}

export function ConvertToProjectModal({ open, demand, onClose, onConverted }: Props) {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [latitude, setLatitude]   = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPublic = demand?.source === "PUBLIC";

  useEffect(() => {
    if (!open || !demand) return;
    setSelectedClientId(null);
    setSearch("");
    setLatitude(demand.latitude != null ? String(demand.latitude) : "");
    setLongitude(demand.longitude != null ? String(demand.longitude) : "");
  }, [open, demand]);

  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    clientService
      .getClients({ search: search.trim() || undefined, page: 0, size: 25 })
      .then((page) => setClients(page.content))
      .catch(() => toast.error("Impossible de charger la liste des clients"))
      .finally(() => setLoadingClients(false));
  }, [open, search]);

  const coordinates = useMemo(() => {
    const lat = latitude ? Number(latitude) : undefined;
    const lng = longitude ? Number(longitude) : undefined;
    return {
      latitude: lat != null && !Number.isNaN(lat) ? lat : undefined,
      longitude: lng != null && !Number.isNaN(lng) ? lng : undefined,
    };
  }, [latitude, longitude]);

  if (!open || !demand) return null;

  const handleConvertExisting = async () => {
    if (!selectedClientId) {
      toast.error("Sélectionnez un client existant");
      return;
    }
    setSubmitting(true);
    try {
      const project = await demandService.convertToProject(demand.id, selectedClientId, coordinates);
      toast.success(`Projet #${project.id} créé`);
      onConverted(project.id);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Conversion impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromotePublic = async () => {
    setSubmitting(true);
    try {
      const project = await demandService.promotePublicAndConvert(demand.id, coordinates);
      toast.success(`Client créé et projet #${project.id} ouvert`);
      onConverted(project.id);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Promotion impossible");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Convertir en projet
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Demande #{demand.id} — « {demand.name} »
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isPublic && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-purple-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-secondary">Prospect public</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ce contact n'a pas encore de compte. Vous pouvez créer une fiche client à partir
                  des informations de la demande, puis convertir en projet en un clic.
                </p>
                <button
                  type="button"
                  onClick={handlePromotePublic}
                  disabled={submitting}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Créer le client + convertir
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              {isPublic ? "Ou rattacher à un client existant" : "Client"}
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
              {loadingClients && (
                <div className="p-4 text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Chargement...
                </div>
              )}
              {!loadingClients && clients.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground">Aucun client trouvé.</p>
              )}
              {clients.map((c) => {
                const active = selectedClientId === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 ${
                      active ? "bg-primary/5" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      readOnly
                      checked={active}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-secondary truncate">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {c.email}
                      </span>
                    </span>
                    {c.projectCount != null && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {c.projectCount} projet(s)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Latitude (optionnel)</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="36.8..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Longitude (optionnel)</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="10.1..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConvertExisting}
            disabled={submitting || !selectedClientId}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderKanban className="w-4 h-4" />}
            Convertir vers ce client
          </button>
        </footer>
      </div>
    </div>
  );
}
