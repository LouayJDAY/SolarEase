import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router";
import { StatusBadge } from "../../components/client/StatusBadge";
import { Search, Filter, Calendar, Zap, MapPin, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import projectService, { ProjectResponse } from "../../services/projectService";
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

export function ClientProjectsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const clientId = id ? Number(id) : null;
    try {
      if (clientId) {
        const data = await projectService.getProjectsByClientId(clientId);
        setProjects(data);
      } else {
        const data = await projectService.getMyProjects();
        setProjects(data);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!user?.userId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const refresh = () => {
      void loadProjects();
    };

    connectWebSocket(user.userId, token);
    subscribeToNotifications(user.userId, refresh);

    return () => {
      unsubscribeFromNotifications(refresh);
      releaseWebSocketConnection();
    };
  }, [user?.userId, loadProjects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.location ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === "all" || p.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [projects, searchQuery, filterStatus]);

  const statusOptions = [
    { value: "all", label: "Tous les projets" },
    { value: "CREATED", label: "Créés" },
    { value: "EN_PREPARATION", label: "En préparation" },
    { value: "INSTALLATEUR_AFFECTE", label: "Installateur affecté" },
    { value: "IN_PROGRESS", label: "En cours" },
    { value: "COMPLETED", label: "Terminés" },
    { value: "CANCELLED", label: "Annulés" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Mes projets</h1>
        <p className="text-gray-600">Suivez l'avancement de vos installations solaires</p>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un projet..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                to={`/client/projects/${project.id}`}
                className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden">
                  <Zap className="w-16 h-16 text-primary/30" />
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={project.status} />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-secondary mb-2 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {project.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                    {project.peakPower && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Zap className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Puissance : {project.peakPower} kWc</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>
                        Début :{" "}
                        {new Date(project.createdAt).toLocaleDateString("fr-TN")}
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">{getProjectPhaseLabel(project)}</span>
                      <span className="font-semibold text-secondary">
                        {getProjectProgressPercent(project)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${getProjectProgressPercent(project)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      {project.description ?? ""}
                    </span>
                    <span className="inline-flex items-center text-primary font-medium group-hover:translate-x-1 transition-transform">
                      Voir détails
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredProjects.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-600 mb-6">
            Essayez de modifier vos critères de recherche
          </p>
          <button
            onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
}
