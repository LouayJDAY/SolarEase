import { Link } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "../../components/client/StatusBadge";
import { KPICard } from "../../components/KPICard";
import { ProductionChart } from "../../components/client/ProductionChart";
import {
  Zap,
  TrendingDown,
  Calendar,
  ArrowRight,
  FileText,
  Bell,
  CheckCircle,
  Clock,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import projectService, { ProjectResponse } from "../../services/projectService";
import notificationService from "../../services/notificationService";
import dimensioningService from "../../services/dimensioningService";
import {
  buildEstimatedMonthlyProduction,
  getLatestDimensioningAnnualKwh,
} from "../../utils/estimatedProduction";
import {
  getProjectPhaseLabel,
  getProjectProgressPercent,
} from "../../utils/projectProgress";
import {
  connectWebSocket,
  releaseWebSocketConnection,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from "../../services/websocketService";

export function ClientDashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productionData, setProductionData] = useState<
    { month: string; production: number; target: number }[]
  >([]);
  const [hasDimensioning, setHasDimensioning] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      const [myProjects, notifs] = await Promise.all([
        projectService.getMyProjects(),
        notificationService.getNotifications(user.userId).catch(() => []),
      ]);
      setProjects(myProjects);
      setNotifications(notifs.slice(0, 3));

      const active =
        myProjects.find((p) => p.status === "IN_PROGRESS") ??
        myProjects.find((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED") ??
        myProjects[0] ??
        null;

      if (active) {
        const dimensionings = await dimensioningService
          .getByProject(active.id)
          .catch(() => []);
        const annualKwh = getLatestDimensioningAnnualKwh(dimensionings);
        if (annualKwh) {
          setProductionData(buildEstimatedMonthlyProduction(annualKwh));
          setHasDimensioning(true);
        } else {
          setProductionData([]);
          setHasDimensioning(false);
        }
      } else {
        setProductionData([]);
        setHasDimensioning(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user?.userId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const refresh = () => {
      void fetchData();
    };

    connectWebSocket(user.userId, token);
    subscribeToNotifications(user.userId, refresh);

    return () => {
      unsubscribeFromNotifications(refresh);
      releaseWebSocketConnection();
    };
  }, [user?.userId, fetchData]);

  const activeProject =
    projects.find((p) => p.status === "IN_PROGRESS") ??
    projects.find((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED") ??
    projects[0] ??
    null;

  const notifIcons: Record<string, any> = {
    default: Bell,
    document: FileText,
    success: CheckCircle,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Bienvenue, {user?.firstName ?? "Client"} 👋
        </h1>
        <p className="text-gray-600">Voici un aperçu de votre installation solaire</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Projets actifs"
          value={String(projects.filter((p) => p.status === "IN_PROGRESS").length)}
          icon={Zap}
        />
        <KPICard
          title="Projets terminés"
          value={String(projects.filter((p) => p.status === "COMPLETED").length)}
          icon={TrendingDown}
          subtitle="Installation terminée"
        />
        <KPICard
          title="Notifications"
          value={String(notifications.filter((n) => !n.read).length)}
          icon={Bell}
          subtitle="Non lues"
        />
        <KPICard
          title="Phase en cours"
          value={
            activeProject ? getProjectPhaseLabel(activeProject) : "—"
          }
          icon={Calendar}
          subtitle={
            activeProject
              ? `${getProjectProgressPercent(activeProject)}% d'avancement`
              : "Aucun projet actif"
          }
        />
      </div>

      {activeProject && (
        <motion.div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-bold text-secondary">{activeProject.name}</h2>
                <StatusBadge status={activeProject.status} />
              </div>
              <p className="text-gray-600">{activeProject.location ?? "Tunisie"}</p>
            </div>
            <Link
              to={`/client/projects/${activeProject.id}`}
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all font-medium group"
            >
              Voir les détails
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">
                {getProjectPhaseLabel(activeProject)}
              </span>
              <span className="font-semibold text-secondary">
                {getProjectProgressPercent(activeProject)}%
              </span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${getProjectProgressPercent(activeProject)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Créé le{" "}
              {new Date(activeProject.createdAt).toLocaleDateString("fr-TN")}
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-secondary">Activité récente</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.length > 0 ? (
              notifications.map((n: any) => {
                const Icon = notifIcons.default;
                return (
                  <div key={n.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-primary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-secondary mb-1">{n.title}</p>
                        <p className="text-sm text-gray-600 mb-1">{n.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(n.createdAt).toLocaleString("fr-TN")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                {loading ? "Chargement..." : "Aucune activité récente"}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-secondary">Actions rapides</h2>
          <Link
            to="/client/projects"
            className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
          >
            Suivre mes projets
          </Link>
          <Link
            to="/client/quotes"
            className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
          >
            Mes devis
          </Link>
          <Link
            to="/client/billing"
            className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
          >
            Mes factures
          </Link>
          <Link
            to="/client/support"
            className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
          >
            Contacter le support
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-secondary mb-2">Production estimée (kWh/mois)</h2>
        <p className="text-sm text-gray-500 mb-6">
          Estimation basée sur le dimensionnement PVGIS de votre projet
        </p>
        {hasDimensioning && productionData.length > 0 ? (
          <ProductionChart data={productionData} type="bar" />
        ) : (
          <div className="text-center py-10 text-gray-500">
            {loading ? (
              "Chargement..."
            ) : activeProject ? (
              <>
                Aucun dimensionnement disponible pour ce projet.{" "}
                <Link to={`/client/projects/${activeProject.id}`} className="text-primary hover:underline">
                  Voir le détail du projet
                </Link>
              </>
            ) : (
              "Aucun projet actif pour afficher la production estimée."
            )}
          </div>
        )}
      </div>
    </div>
  );
}
