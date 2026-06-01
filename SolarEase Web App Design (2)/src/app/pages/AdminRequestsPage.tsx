import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import toast from "react-hot-toast";
import { RefreshCw, Wifi, WifiOff, ShieldAlert } from "lucide-react";

import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";

import demandService, {
  Demand,
  DemandStatus,
  DemandSource,
  DemandPriority,
} from "../services/demandService";
import { connectWebSocket, isConnected as wsConnected } from "../services/websocketService";

import { RequestFilters, RequestFiltersValue } from "../components/requests/RequestFilters";
import { RequestList } from "../components/requests/RequestList";
import { RequestDetailPanel } from "../components/requests/RequestDetailPanel";
import { ConvertToProjectModal } from "../components/requests/ConvertToProjectModal";
import { AskCompletionModal } from "../components/requests/AskCompletionModal";
import RejectModal from "../components/RejectModal";
import { useAdminDemandsLive } from "../hooks/useAdminDemandsLive";
import { useRequestHotkeys } from "../components/requests/useRequestHotkeys";

type BusyAction = "validate" | "complete" | "reject" | "assign" | null;

export default function AdminRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.role === "ADMIN";

  // ── Filters synced with the URL ────────────────────────────────────────
  const filters: RequestFiltersValue = useMemo(
    () => ({
      status: (searchParams.get("status") as RequestFiltersValue["status"]) || "ALL",
      source: (searchParams.get("source") as RequestFiltersValue["source"]) || "ALL",
      q: searchParams.get("q") ?? "",
    }),
    [searchParams]
  );

  const setFilters = useCallback(
    (next: RequestFiltersValue) => {
      const sp = new URLSearchParams();
      if (next.status !== "ALL") sp.set("status", next.status);
      if (next.source !== "ALL") sp.set("source", next.source);
      if (next.q.trim()) sp.set("q", next.q.trim());
      setSearchParams(sp, { replace: true });
    },
    [setSearchParams]
  );

  // ── State ──────────────────────────────────────────────────────────────
  const [demands, setDemands] = useState<Demand[]>([]);
  const [counts, setCounts] = useState<Record<DemandStatus | "ALL", number>>({
    ALL: 0,
    NOUVELLE: 0,
    A_COMPLETER: 0,
    VALIDEE: 0,
    REJETEE: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [unseenIds, setUnseenIds] = useState<Set<number>>(new Set());
  const [convertOpen, setConvertOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [wsLive, setWsLive] = useState(false);

  const selected = useMemo(
    () => demands.find((d) => d.id === selectedId) ?? null,
    [demands, selectedId]
  );

  // ── Data loading ──────────────────────────────────────────────────────
  const fetchDemands = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const page = await demandService.getAllDemands({
          page: 0,
          size: 50,
          status: filters.status === "ALL" ? undefined : (filters.status as DemandStatus),
          source: filters.source === "ALL" ? undefined : (filters.source as DemandSource),
          q: filters.q,
        });
        setDemands(page.content);
        if (page.content.length > 0 && selectedId == null) {
          setSelectedId(page.content[0].id);
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Impossible de charger les demandes");
      } finally {
        setLoading(false);
      }
    },
    [filters.status, filters.source, filters.q, selectedId]
  );

  // Counts (sum per status) — single round-trip without filters
  const fetchCounts = useCallback(async () => {
    try {
      const all = await demandService.getAllDemands({ page: 0, size: 500 });
      const buckets: Record<DemandStatus | "ALL", number> = {
        ALL: all.totalElements,
        NOUVELLE: 0,
        A_COMPLETER: 0,
        VALIDEE: 0,
        REJETEE: 0,
      };
      all.content.forEach((d) => {
        buckets[d.status] = (buckets[d.status] ?? 0) + 1;
      });
      setCounts(buckets);
    } catch {
      // counts are best-effort, no toast
    }
  }, []);

  // Reload whenever the filters change
  useEffect(() => {
    if (!isAdmin) return;
    fetchDemands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.source, filters.q, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchCounts();
    const interval = setInterval(fetchCounts, 60_000);
    return () => clearInterval(interval);
  }, [isAdmin, fetchCounts]);

  // ── Live STOMP updates ────────────────────────────────────────────────
  useAdminDemandsLive({
    userId: user?.userId ?? null,
    token: localStorage.getItem("accessToken"),
    enabled: isAdmin,
    onEvent: (event) => {
      if (event.event === "DEMAND_CREATED") {
        toast(`Nouvelle demande de ${event.clientFirstName ?? event.clientEmail ?? "Prospect"}`, {
          icon: "📩",
          duration: 5000,
        });
        setUnseenIds((prev) => {
          const next = new Set(prev);
          next.add(event.demandId);
          return next;
        });
        // Reload silently to insert the new row at the top
        fetchDemands({ silent: true });
        fetchCounts();
      }
    },
  });

  // Mark the WS as live once connected
  useEffect(() => {
    if (!isAdmin || !user?.userId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    if (!wsConnected()) {
      connectWebSocket(user.userId, token, { onConnected: () => setWsLive(true) });
    } else {
      setWsLive(true);
    }
  }, [isAdmin, user?.userId]);

  // ── Selection handling ────────────────────────────────────────────────
  const selectDemand = useCallback((d: Demand) => {
    setSelectedId(d.id);
    setUnseenIds((prev) => {
      if (!prev.has(d.id)) return prev;
      const next = new Set(prev);
      next.delete(d.id);
      return next;
    });
  }, []);

  const selectByOffset = useCallback(
    (offset: number) => {
      if (demands.length === 0) return;
      const idx = demands.findIndex((d) => d.id === selectedId);
      const nextIdx = idx === -1 ? 0 : Math.min(Math.max(idx + offset, 0), demands.length - 1);
      selectDemand(demands[nextIdx]);
    },
    [demands, selectedId, selectDemand]
  );

  // ── Actions ───────────────────────────────────────────────────────────
  const handleAssignToMe = useCallback(async () => {
    if (!selected) return;
    setBusyAction("assign");
    try {
      const updated = await demandService.assign(selected.id);
      setDemands((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success("Demande assignée");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Impossible d'assigner");
    } finally {
      setBusyAction(null);
    }
  }, [selected]);

  const handlePriority = useCallback(
    async (priority: DemandPriority) => {
      if (!selected) return;
      setBusyAction("assign");
      try {
        const updated = await demandService.updatePriority(selected.id, priority);
        setDemands((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Impossible de changer la priorité");
      } finally {
        setBusyAction(null);
      }
    },
    [selected]
  );

  const handleAskCompletion = useCallback(
    async (note: string) => {
      if (!selected) return;
      setBusyAction("complete");
      try {
        const updated = await demandService.updateStatus(selected.id, "A_COMPLETER", note);
        setDemands((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setCompleteOpen(false);
        toast.success("Complément demandé au client");
        fetchCounts();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Impossible d'envoyer la demande");
      } finally {
        setBusyAction(null);
      }
    },
    [selected, fetchCounts]
  );

  const handleReject = useCallback(
    async (reason: string) => {
      if (!selected) return;
      setBusyAction("reject");
      try {
        const updated = await demandService.updateStatus(selected.id, "REJETEE", undefined, reason);
        setDemands((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        setRejectOpen(false);
        toast.success("Demande rejetée");
        fetchCounts();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? "Impossible de rejeter la demande");
      } finally {
        setBusyAction(null);
      }
    },
    [selected, fetchCounts]
  );

  const handleConverted = useCallback(
    (projectId: number) => {
      setConvertOpen(false);
      fetchDemands({ silent: true });
      fetchCounts();
      // Soft navigation to keep the admin in the Inbox; jump to the new project via button
      toast.success(`Projet #${projectId} ouvert dans Projets`, {
        duration: 4000,
      });
    },
    [fetchDemands, fetchCounts]
  );

  // ── Hotkeys ───────────────────────────────────────────────────────────
  const hotkeyHandlersRef = useRef({
    onNext:           () => selectByOffset(1),
    onPrev:           () => selectByOffset(-1),
    onConvert:        () => selected && !["VALIDEE", "REJETEE"].includes(selected.status) && setConvertOpen(true),
    onAskCompletion:  () => selected && !["VALIDEE", "REJETEE"].includes(selected.status) && setCompleteOpen(true),
    onReject:         () => selected && !["VALIDEE", "REJETEE"].includes(selected.status) && setRejectOpen(true),
    onFocusSearch:    () => {
      const el = document.getElementById("requests-search-input") as HTMLInputElement | null;
      el?.focus();
      el?.select();
    },
  });
  hotkeyHandlersRef.current.onNext           = () => selectByOffset(1);
  hotkeyHandlersRef.current.onPrev           = () => selectByOffset(-1);
  hotkeyHandlersRef.current.onConvert        = () => selected && !["VALIDEE", "REJETEE"].includes(selected.status) && setConvertOpen(true);
  hotkeyHandlersRef.current.onAskCompletion  = () => selected && !["VALIDEE", "REJETEE"].includes(selected.status) && setCompleteOpen(true);
  hotkeyHandlersRef.current.onReject         = () => selected && !["VALIDEE", "REJETEE"].includes(selected.status) && setRejectOpen(true);

  useRequestHotkeys(
    {
      onNext:           () => hotkeyHandlersRef.current.onNext(),
      onPrev:           () => hotkeyHandlersRef.current.onPrev(),
      onConvert:        () => hotkeyHandlersRef.current.onConvert(),
      onAskCompletion:  () => hotkeyHandlersRef.current.onAskCompletion(),
      onReject:         () => hotkeyHandlersRef.current.onReject(),
      onFocusSearch:    () => hotkeyHandlersRef.current.onFocusSearch(),
    },
    isAdmin
  );

  // ── Role guard ────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 p-8">
          <div className="max-w-md mx-auto mt-20 bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-lg font-semibold text-secondary mb-2">Accès réservé aux administrateurs</h1>
            <p className="text-sm text-muted-foreground mb-5">
              La gestion des demandes clients nécessite un compte administrateur.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
            >
              Retour au tableau de bord
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="px-6 py-6 space-y-5">
          {/* Page header */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-secondary">Demandes clients</h1>
              <p className="text-sm text-muted-foreground">
                Inbox temps réel des sollicitations publiques et portail —{" "}
                <span className="font-medium text-secondary">{counts.ALL}</span> demande(s),{" "}
                <span className="font-medium text-blue-700">{counts.NOUVELLE}</span> nouvelle(s).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  wsLive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                }`}
                title={wsLive ? "Temps réel actif" : "Temps réel inactif (rechargez)"}
              >
                {wsLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {wsLive ? "Live" : "Hors-ligne"}
              </span>
              <button
                onClick={() => {
                  fetchDemands();
                  fetchCounts();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 transition-colors"
                title="Rafraîchir"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Rafraîchir
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
            <RequestFilters
              value={filters}
              counts={{
                ALL:         counts.ALL ?? 0,
                NOUVELLE:    counts.NOUVELLE ?? 0,
                A_COMPLETER: counts.A_COMPLETER ?? 0,
                VALIDEE:     counts.VALIDEE ?? 0,
                REJETEE:     counts.REJETEE ?? 0,
              }}
              onChange={setFilters}
            />
          </div>

          {/* Main split layout */}
          <div className="grid grid-cols-12 gap-5 h-[calc(100vh-260px)] min-h-[520px]">
            {/* List column */}
            <div className="col-span-12 lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {demands.length} résultat(s)
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Raccourcis : j/k · v · c · r · /
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <RequestList
                  demands={demands}
                  selectedId={selectedId}
                  loading={loading}
                  unseenIds={unseenIds}
                  onSelect={selectDemand}
                />
              </div>
            </div>

            {/* Detail column */}
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
              <RequestDetailPanel
                demand={selected}
                canAct={isAdmin}
                busyAction={busyAction}
                onConvert={() => setConvertOpen(true)}
                onAskCompletion={() => setCompleteOpen(true)}
                onReject={() => setRejectOpen(true)}
                onAssignToMe={handleAssignToMe}
                onChangePriority={handlePriority}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ConvertToProjectModal
        open={convertOpen}
        demand={selected}
        onClose={() => setConvertOpen(false)}
        onConverted={handleConverted}
      />
      <AskCompletionModal
        open={completeOpen}
        processing={busyAction === "complete"}
        onClose={() => setCompleteOpen(false)}
        onConfirm={handleAskCompletion}
      />
      <RejectModal
        open={rejectOpen}
        processing={busyAction === "reject"}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
