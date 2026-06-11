import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { LifeBuoy, Loader2, Mail, RefreshCw, User } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import supportService, { SupportTicket, SupportTicketStatus } from "../services/supportService";

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
};

const STATUS_COLORS: Record<SupportTicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
};

const PRIORITY_LABELS = {
  LOW: "Basse",
  NORMAL: "Moyenne",
  HIGH: "Haute",
} as const;

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR");
}

export function AdminSupportTicketsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await supportService.getAllTicketsAdmin();
      setTickets(data);
      if (data.length > 0) {
        setSelectedId((current) =>
          current && data.some((t) => t.id === current) ? current : data[0].id
        );
      } else {
        setSelectedId(null);
      }
    } catch {
      toast.error("Impossible de charger les tickets support");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const selected = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId]
  );

  const counts = useMemo(
    () => ({
      ALL: tickets.length,
      OPEN: tickets.filter((t) => t.status === "OPEN").length,
      IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      RESOLVED: tickets.filter((t) => t.status === "RESOLVED").length,
    }),
    [tickets]
  );

  const updateStatus = async (status: SupportTicketStatus) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const updated = await supportService.updateTicketStatusAdmin(selected.id, status);
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(`Ticket marqué : ${STATUS_LABELS[status]}`);
    } catch {
      toast.error("Impossible de mettre à jour le ticket");
    } finally {
      setUpdating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        Accès réservé à l&apos;administrateur.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
              <LifeBuoy className="w-7 h-7 text-primary" />
              Tickets support
            </h1>
            <p className="text-gray-600 mt-1">
              Demandes d&apos;aide envoyées par les clients depuis leur espace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchTickets()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary"
              }`}
            >
              {key === "ALL" ? "Tous" : STATUS_LABELS[key]} ({counts[key]})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[520px]">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-500 px-6">
                Aucun ticket {statusFilter !== "ALL" ? "dans cette catégorie" : "pour le moment"}.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[640px] overflow-y-auto">
                {filtered.map((ticket) => (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedId === ticket.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-secondary truncate">{ticket.subject}</p>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status]}`}
                        >
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {ticket.clientName ?? "Client"} • {formatDate(ticket.createdAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-6">
            {!selected ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Sélectionnez un ticket
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-secondary">{selected.subject}</h2>
                    <p className="text-sm text-gray-500 mt-1">Ticket #{selected.id}</p>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-primary" />
                    {selected.clientName ?? "Client inconnu"}
                  </div>
                  {selected.clientEmail && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-primary" />
                      <a href={`mailto:${selected.clientEmail}`} className="hover:text-primary">
                        {selected.clientEmail}
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Message</p>
                  <p className="text-secondary whitespace-pre-wrap rounded-xl bg-gray-50 p-4 border border-gray-100">
                    {selected.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>Priorité : {PRIORITY_LABELS[selected.priority]}</span>
                  <span>Créé : {formatDate(selected.createdAt)}</span>
                  {selected.resolvedAt && <span>Résolu : {formatDate(selected.resolvedAt)}</span>}
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  {selected.status !== "IN_PROGRESS" && selected.status !== "RESOLVED" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => void updateStatus("IN_PROGRESS")}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      Prendre en charge
                    </button>
                  )}
                  {selected.status !== "RESOLVED" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => void updateStatus("RESOLVED")}
                      className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      Marquer résolu
                    </button>
                  )}
                  {selected.status === "RESOLVED" && (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => void updateStatus("OPEN")}
                      className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Rouvrir
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminSupportTicketsPage;
