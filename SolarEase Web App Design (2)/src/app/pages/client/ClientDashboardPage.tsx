import { Link } from "react-router";
import { useEffect, useState } from "react";
import { StatusBadge } from "../../components/client/StatusBadge";
import { KPICard } from "../../components/KPICard";
import { ProductionChart } from "../../components/client/ProductionChart";
import {
  Zap,
  TrendingDown,
  Leaf,
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

export function ClientDashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const [myProjects, notifs] = await Promise.all([
          projectService.getMyProjects(),
          notificationService.getNotifications(user.userId).catch(() => []),
        ]);
        setProjects(myProjects);
        setNotifications(notifs.slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const STATUS_PROGRESS: Record<string, number> = {
    CREATED: 10,
    EN_PREPARATION: 25,
    INSTALLATEUR_AFFECTE: 40,
    IN_PROGRESS: 65,
    COMPLETED: 100,
    CANCELLED: 0,
  };

  const activeProject =
    projects.find((p) => p.status === "IN_PROGRESS") ??
    projects.find((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED") ??
    projects[0] ??
    null;

  const productionData = [
    { month: "Oct", production: 680, target: 700 },
    { month: "Nov", production: 720, target: 700 },
    { month: "Déc", production: 650, target: 700 },
    { month: "Jan", production: 780, target: 700 },
    { month: "Fév", production: 810, target: 700 },
    { month: "Mar", production: 850, target: 700 },
  ];

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
          title="Prochaine maintenance"
          value="À planifier"
          icon={Calendar}
          subtitle="Contactez votre installateur"
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
              <span className="text-gray-600">Progression globale</span>
              <span className="font-semibold text-secondary">
                {STATUS_PROGRESS[activeProject.status] ?? 10}%
              </span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${STATUS_PROGRESS[activeProject.status] ?? 10}%` }}
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
            to="/client/documents"
            className="block bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all"
          >
            Mes documents
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
        <h2 className="text-xl font-bold text-secondary mb-6">Production mensuelle</h2>
        <ProductionChart data={productionData} type="bar" />
      </div>
    </div>
  );
}
