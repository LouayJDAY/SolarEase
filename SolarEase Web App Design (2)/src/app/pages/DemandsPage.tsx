import React, { useEffect, useState, useCallback } from "react";
import {
  FileQuestion,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Mail,
  MapPin,
  UserRound,
  Zap,
  CalendarDays,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import demandService, { Demand, DemandStatus } from "../services/demandService";
import clientService from "../services/clientService";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";

const STATUS_CONFIG: Record<
  DemandStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  NOUVELLE: {
    label: "Nouvelle",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Clock,
  },
  A_COMPLETER: {
    label: "À compléter",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: AlertCircle,
  },
  VALIDEE: {
    label: "Validée",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  REJETEE: {
    label: "Rejetée",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
  },
};

const FILTER_OPTIONS: Array<{ value: "ALL" | DemandStatus; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "NOUVELLE", label: "Nouvelles" },
  { value: "A_COMPLETER", label: "À compléter" },
  { value: "VALIDEE", label: "Validées" },
  { value: "REJETEE", label: "Rejetées" },
];

interface ActionModalState {
  demand: Demand;
  action: "approve" | "reject" | "request_info" | "convert" | "send_invitation";
}

export function DemandsPage() {
  const navigate = useNavigate();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | DemandStatus>("ALL");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionClientId, setActionClientId] = useState("");
  const [actionLatitude, setActionLatitude] = useState("");
  const [actionLongitude, setActionLongitude] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [clientList, setClientList] = useState<Array<{ id: number; label: string }>>([]);
  const [invitationSendEmail, setInvitationSendEmail] = useState(true);
  const [invitationSendSms, setInvitationSendSms] = useState(true);
  const [invitationCustomMessage, setInvitationCustomMessage] = useState("");

  const fetchDemands = useCallback(async () => {
    setLoading(true);
    try {
      const data = await demandService.getAllDemands(
        0,
        50,
        filter === "ALL" ? undefined : filter
      );
      setDemands(data.content);
      setTotal(data.totalElements);
    } catch {
      toast.error("Impossible de charger les demandes");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  useEffect(() => {
    clientService
      .getClients({ size: 200 })
      .then((page) =>
        setClientList(
          page.content.map((c: any) => ({
            id: c.id,
            label: `${c.firstName} ${c.lastName} — ${c.email || ""}`.trim(),
          }))
        )
      )
      .catch(() => {});
  }, []);

  const filtered = demands.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.clientEmail || "").toLowerCase().includes(q) ||
      (d.clientFirstName || "").toLowerCase().includes(q) ||
      (d.clientLastName || "").toLowerCase().includes(q)
    );
  });

  const openAction = (demand: Demand, action: ActionModalState["action"]) => {
    setActionModal({ demand, action });
    setActionNote("");
    setActionClientId(clientList[0]?.id?.toString() ?? "");
    setActionLatitude(
      typeof demand.latitude === "number" && !Number.isNaN(demand.latitude)
        ? String(demand.latitude)
        : ""
    );
    setActionLongitude(
      typeof demand.longitude === "number" && !Number.isNaN(demand.longitude)
        ? String(demand.longitude)
        : ""
    );
    // Reset invitation-specific state; SMS only pre-enabled when a phone number exists
    setInvitationSendEmail(true);
    setInvitationSendSms(!!(demand.clientPhone));
    setInvitationCustomMessage("");
  };

  const handleAction = async () => {
    console.log("handleAction called", { actionModal, actionLoading });
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const { demand, action } = actionModal;
      if (action === "approve") {
        await demandService.updateStatus(demand.id, "VALIDEE", actionNote || undefined);
        toast.success("Demande validée");
      } else if (action === "reject") {
        if (!actionNote.trim()) {
          toast.error("Veuillez saisir le motif de refus");
          setActionLoading(false);
          return;
        }
        await demandService.updateStatus(demand.id, "REJETEE", undefined, actionNote);
        toast.success("Demande rejetée");
      } else if (action === "request_info") {
        await demandService.updateStatus(
          demand.id,
          "A_COMPLETER",
          actionNote || "Informations supplémentaires requises"
        );
        toast.success("Demande marquée 'À compléter'");
      } else if (action === "convert") {
        const clientId = Number(actionClientId);
        if (!clientId) {
          toast.error("Veuillez sélectionner un client");
          setActionLoading(false);
          return;
        }
        const latitude = Number(actionLatitude);
        const longitude = Number(actionLongitude);
        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          toast.error("Latitude et longitude sont obligatoires pour créer le projet");
          setActionLoading(false);
          return;
        }
        const project = await demandService.convertToProject(demand.id, clientId, {
          latitude,
          longitude,
        });
        toast.success("Projet créé avec succès !");
        setActionModal(null);
        navigate(`/projects/${project.id}`);
        return;
      } else if (action === "send_invitation") {
        if (!invitationSendEmail && !invitationSendSms) {
          toast.error("Veuillez sélectionner au moins un canal de communication");
          setActionLoading(false);
          return;
        }
        if (invitationSendSms && !demand.clientPhone) {
          toast.error("Numéro de téléphone requis pour envoyer un SMS");
          setActionLoading(false);
          return;
        }
        const clientName = `${demand.clientFirstName || ""} ${demand.clientLastName || ""}`.trim();
        const projectId = demand.projectId ?? null;
        console.log(
          "📧 Envoi invitation:",
          `demandId=${demand.id}`,
          `email=${demand.clientEmail}`,
          `name=${clientName}`,
          `projectId=${projectId ?? "none"}`,
          `phone=${demand.clientPhone || demand.phone || ""}`,
          `sendEmail=${invitationSendEmail}`,
          `sendSms=${invitationSendSms}`,
          `message=${invitationCustomMessage || ""}`
        );
        try {
          const result = await demandService.sendInvitation(
            demand.id,
            demand.clientEmail,
            clientName,
            projectId,
            demand.clientPhone || demand.phone,
            invitationCustomMessage || undefined,
            invitationSendEmail,
            invitationSendSms
          );
          if (result.success === "true") {
            toast.success("Invitation envoyée avec succès !");
          } else {
            toast.error("Invitation partiellement envoyée : " + result.message);
          }
          setActionModal(null);
          setInvitationCustomMessage("");
          setInvitationSendEmail(true);
          setInvitationSendSms(true);
          await fetchDemands();
        } catch (invitationError: any) {
          console.error("❌ Erreur envoi invitation:", invitationError);
          throw invitationError;
        }
        return;
      }
      setActionModal(null);
      await fetchDemands();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Action impossible");
    } finally {
      setActionLoading(false);
    }
  };

  const modalTitle: Record<ActionModalState["action"], string> = {
    approve: "Valider la demande",
    reject: "Rejeter la demande",
    request_info: "Demander des informations complémentaires",
    convert: "Créer un projet depuis la demande",
    send_invitation: "Envoyer une invitation au client",
  };

  // Count by status for the header pills
  const counts = demands.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16 p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Demandes clients</h1>
            <p className="text-sm text-slate-500 mt-1">
              {total} demande{total !== 1 ? "s" : ""} reçue{total !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={fetchDemands}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-lg text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Stats pills */}
        {total > 0 && (
          <div className="flex gap-3 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const n = counts[key] || 0;
              if (!n) return null;
              const Icon = cfg.icon;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg} border ${cfg.border}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {n} {cfg.label.toLowerCase()}
                </div>
              );
            })}
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou client..."
              className="pl-9 pr-4 py-2.5 border border-slate-200 bg-white rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  filter === opt.value
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
                {opt.value !== "ALL" && counts[opt.value] ? (
                  <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 font-bold ${
                    filter === opt.value ? "bg-white/20" : "bg-slate-100"
                  }`}>
                    {counts[opt.value]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500">Chargement des demandes...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary mb-1">Aucune demande</h3>
            <p className="text-slate-500 text-sm">
              {search
                ? `Aucun résultat pour "${search}"`
                : "Les demandes soumises par les clients apparaîtront ici."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((demand) => {
              const st = STATUS_CONFIG[demand.status];
              const Icon = st.icon;
              const clientName = `${demand.clientFirstName || ""} ${demand.clientLastName || ""}`.trim() || "—";

              return (
                <article
                  key={demand.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl ${st.bg} border ${st.border}`}>
                        <Icon className={`w-5 h-5 ${st.color}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-secondary text-base leading-tight truncate">
                          {demand.name || "Demande sans titre"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          #{demand.id} · Soumis le {new Date(demand.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.color} ${st.bg} border ${st.border}`}>
                        {st.label}
                      </span>
                      {/* Action buttons */}
                      {(demand.status === "NOUVELLE" || demand.status === "A_COMPLETER") && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openAction(demand, "approve")}
                            className="px-3.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors"
                          >
                            Valider
                          </button>
                          {demand.status === "NOUVELLE" && (
                            <button
                              onClick={() => openAction(demand, "request_info")}
                              className="px-3.5 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold hover:bg-orange-200 transition-colors"
                            >
                              Infos
                            </button>
                          )}
                          <button
                            onClick={() => openAction(demand, "reject")}
                            className="px-3.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                      {demand.status === "VALIDEE" && !demand.projectId && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => openAction(demand, "convert")}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                          >
                            Créer projet
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openAction(demand, "send_invitation")}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                          >
                            📧 Envoyer invitation
                          </button>
                        </div>
                      )}
                      {demand.status === "VALIDEE" && demand.projectId && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => navigate(`/projects/${demand.projectId}`)}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
                          >
                            Voir projet #{demand.projectId}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openAction(demand, "send_invitation")}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                          >
                            📧 Envoyer invitation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client info */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Client</p>
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-2 text-sm text-slate-700">
                          <UserRound className="w-4 h-4 text-slate-400 shrink-0" />
                          {clientName}
                        </span>
                        {demand.clientEmail && (
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            {demand.clientEmail}
                          </span>
                        )}
                        {demand.location && (
                          <span className="flex items-center gap-2 text-sm text-slate-700">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            {demand.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Technical details */}
                    {(demand.peakPower || demand.availableArea || demand.budget) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Détails techniques</p>
                        <div className="flex flex-wrap gap-2">
                          {demand.peakPower && (
                            <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-800 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-yellow-200">
                              <Zap className="w-3.5 h-3.5" />
                              {demand.peakPower} kWc
                            </span>
                          )}
                          {demand.availableArea && (
                            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-blue-200">
                              {demand.availableArea} m²
                            </span>
                          )}
                          {demand.budget && (
                            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-emerald-200">
                              <DollarSign className="w-3.5 h-3.5" />
                              {demand.budget.toLocaleString("fr-TN")} TND
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {demand.description && (
                    <div className="px-6 pb-4">
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 leading-relaxed">
                        {demand.description}
                      </p>
                    </div>
                  )}

                  {/* Admin note / rejection */}
                  {demand.adminNote && (
                    <div className="px-6 pb-4">
                      <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          <span className="font-semibold">Note admin : </span>
                          {demand.adminNote}
                        </p>
                      </div>
                    </div>
                  )}
                  {demand.rejectionReason && (
                    <div className="px-6 pb-4">
                      <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">
                          <span className="font-semibold">Motif de refus : </span>
                          {demand.rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Action Modal ────────────────────────────────────────────────── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setActionModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-secondary">{modalTitle[actionModal.action]}</h2>
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">{actionModal.demand.name}</span>
                {" · "}
                {`${actionModal.demand.clientFirstName || ""} ${actionModal.demand.clientLastName || ""}`.trim() || actionModal.demand.clientEmail}
              </p>
            </div>

            {actionModal.action === "convert" && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Associer à un client (fiche projet) <span className="text-red-500">*</span>
                </label>
                <select
                  value={actionClientId}
                  onChange={(e) => setActionClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {clientList.length === 0 && <option value="">— Aucun client enregistré —</option>}
                  {clientList.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Latitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={actionLatitude}
                      onChange={(e) => setActionLatitude(e.target.value)}
                      placeholder="36.8065"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Longitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={actionLongitude}
                      onChange={(e) => setActionLongitude(e.target.value)}
                      placeholder="10.1815"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Le projet sera créé avec ce client dans la base projets.</p>
              </div>
            )}

            {actionModal.action === "send_invitation" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Canaux de communication</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitationSendEmail}
                        onChange={(e) => setInvitationSendEmail(e.target.checked)}
                        className="w-4 h-4 text-primary rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-700">📧 Email</p>
                        <p className="text-xs text-slate-500">{actionModal.demand.clientEmail}</p>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitationSendSms}
                        onChange={(e) => setInvitationSendSms(e.target.checked)}
                        disabled={!actionModal.demand.clientPhone}
                        className="w-4 h-4 text-primary rounded disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-700">📱 SMS</p>
                        <p className="text-xs text-slate-500">
                          {actionModal.demand.clientPhone ? actionModal.demand.clientPhone : "Aucun numéro disponible"}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Message personnalisé (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    value={invitationCustomMessage}
                    onChange={(e) => setInvitationCustomMessage(e.target.value)}
                    placeholder="Ajoutez un message personnel pour le client..."
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">ℹ️ Le client recevra:</span><br/>
                    ✓ Lien de création de compte<br/>
                    ✓ Référence de son projet<br/>
                    ✓ Informations de contact
                  </p>
                </div>
              </div>
            )}

            {(actionModal.action === "approve" || actionModal.action === "request_info") && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {actionModal.action === "request_info"
                    ? "Message au client *"
                    : "Note de validation (optionnel)"}
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={
                    actionModal.action === "request_info"
                      ? "Décrivez les informations manquantes..."
                      : "Commentaire interne optionnel..."
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            {actionModal.action === "reject" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Motif de refus <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Expliquez clairement la raison du refus..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                  actionModal.action === "reject"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {actionLoading ? "En cours..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
