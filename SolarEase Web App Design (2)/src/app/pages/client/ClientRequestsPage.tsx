import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Plus, FileQuestion, Calendar, MapPin, Zap } from "lucide-react";
import demandService, { Demand } from "../../services/demandService";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  NOUVELLE: { label: "Nouvelle demande", color: "text-blue-700", bg: "bg-blue-100" },
  A_COMPLETER: { label: "À compléter", color: "text-orange-700", bg: "bg-orange-100" },
  VALIDEE: { label: "Validée", color: "text-green-700", bg: "bg-green-100" },
  REJETEE: { label: "Rejetée", color: "text-red-700", bg: "bg-red-100" },
};

/** Notification titles emitted by the backend NotificationWebSocketService for demand events. */
const DEMAND_NOTIFICATION_TITLES = new Set([
  "Demande à compléter",
  "Demande validée",
  "Demande rejetée",
]);

export function ClientRequestsPage() {
  const { user } = useAuth();
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  // Connect to the user's notifications stream -- the AuthContext userId is the
  // identity-service UUID that the backend uses to route the queue.
  const { notifications } = useNotifications({
    userId: user?.userId ?? null,
    token: localStorage.getItem("accessToken"),
  });

  // When a demand-related notification lands, show a toast and re-fetch the list
  // so the new status (and any rejection/admin note) appears immediately.
  const lastSeenNotificationId = React.useRef<string | number | null>(null);
  useEffect(() => {
    if (notifications.length === 0) return;
    const top = notifications[0];
    if (lastSeenNotificationId.current === top.id) return;
    lastSeenNotificationId.current = top.id;

    if (DEMAND_NOTIFICATION_TITLES.has(top.title)) {
      const tone =
        top.title === "Demande validée"
          ? "success"
          : top.title === "Demande rejetée"
          ? "error"
          : "info";
      const description = top.message;
      if (tone === "success") {
        toast.success(top.title, { description });
      } else if (tone === "error") {
        toast.error(top.title, { description });
      } else {
        toast(top.title, { description });
      }
      setReloadKey((k) => k + 1);
    }
  }, [notifications]);

  useEffect(() => {
    setLoading(true);
    demandService
      .getMyDemands(0, 20)
      .then((page) => {
        setDemands(page.content);
        setTotal(page.totalElements);
      })
      .catch(() => toast.error("Impossible de charger vos demandes"))
      .finally(() => setLoading(false));
  }, [reloadKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Mes demandes</h1>
          <p className="text-gray-600">Suivez l'état de vos demandes de projet solaire</p>
        </div>
        <Link
          to="/client/request/new"
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle demande
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : demands.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary mb-2">Aucune demande pour le moment</h3>
          <p className="text-gray-600 mb-6">Soumettez votre première demande pour démarrer votre projet solaire.</p>
          <Link
            to="/client/request/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Soumettre une demande
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {demands.map((demand) => {
            const st = STATUS_LABELS[demand.status] ?? { label: demand.status, color: "text-gray-700", bg: "bg-gray-100" };
            return (
              <div key={demand.id} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-secondary">{demand.name}</h3>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${st.color} ${st.bg}`}>
                    {st.label}
                  </span>
                </div>

                {demand.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{demand.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  {demand.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {demand.location}
                    </span>
                  )}
                  {demand.peakPower && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> {demand.peakPower} kWc
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(demand.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>

                {demand.adminNote && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                    <strong>Note admin :</strong> {demand.adminNote}
                  </div>
                )}

                {demand.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                    <strong>Motif de refus :</strong> {demand.rejectionReason}
                  </div>
                )}

                {demand.projectId && (
                  <Link
                    to={`/client/projects/${demand.projectId}`}
                    className="inline-block text-sm text-primary font-medium hover:underline"
                  >
                    Voir le projet →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {total > demands.length && (
        <p className="text-center text-sm text-gray-500">
          Affichage de {demands.length} sur {total} demandes
        </p>
      )}
    </div>
  );
}
