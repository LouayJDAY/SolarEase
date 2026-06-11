import React from "react";
import { useNavigate } from "react-router";
import { Search, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { ProjectStatsCards } from "../components/ProjectStatsCards";
import {
  ProjectFilterBar,
  ProjectStatus,
  SortOption,
  ViewMode,
} from "../components/ProjectFilterBar";
import { ProjectsTable, Project } from "../components/ProjectsTable";
import { NewProjectModal } from "../components/NewProjectModal";
import { ProjectEmptyState } from "../components/ProjectEmptyState";
import { Pagination } from "../components/Pagination";
import projectService, { ProjectResponse, DashboardStats } from "../services/projectService";
import { useAuth } from "../context/AuthContext";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { isValidProjectCoordinates } from "../utils/geo";
import { getProjectProgressPercent } from "../utils/projectProgress";

// Map backend status to frontend status
function mapStatus(s: string): Project["status"] {
  const map: Record<string, Project["status"]> = {
    CREATED: "draft",
    EN_PREPARATION: "inProgress",
    INSTALLATEUR_AFFECTE: "inProgress",
    IN_PROGRESS: "installation",
    COMPLETED: "completed",
    CANCELLED: "draft",
  };
  return map[s] || "draft";
}

function toProject(p: ProjectResponse): Project {
  const installerLabel = p.installerEmail || p.installerId || "—";
  const assignedByLabel = p.assignedByAdminEmail || p.assignedByAdminId || "—";
  return {
    id: String(p.id),
    name: p.name,
    projectId: `PRJ-${p.id}`,
    client: { name: p.client ? `${p.client.firstName} ${p.client.lastName}` : "—" },
    installer: { name: installerLabel },
    assignedBy: assignedByLabel,
    location: p.location,
    systemSize: p.peakPower ? `${p.peakPower} kWc` : "—",
    status: mapStatus(p.status),
    progress: getProjectProgressPercent(p),
    startDate: new Date(p.createdAt).toLocaleDateString("fr-FR"),
  };
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeStatus, setActiveStatus] = React.useState<ProjectStatus>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("date");
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [stats, setStats] = React.useState({ total: 0, created: 0, inProgress: 0, completed: 0, cancelled: 0 });
  const [loadError, setLoadError] = React.useState("");
  const itemsPerPage = 6;

  const debouncedSearch = React.useMemo(() => searchQuery.trim(), [searchQuery]);

  const { user } = useAuth();

  const fetchProjects = React.useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      // Map frontend status filter to backend status
      let statusParam: string | undefined;
      if (activeStatus === "draft") statusParam = "CREATED";
      else if (activeStatus === "inProgress") statusParam = "IN_PROGRESS";
      else if (activeStatus === "completed") statusParam = "COMPLETED";
      else if (activeStatus === "cancelled") statusParam = "CANCELLED";

      const sortByMap: Record<string, string> = { date: "createdAt", name: "name", client: "createdAt" };

      const params = {
        status: statusParam,
        search: debouncedSearch || undefined,
        page: currentPage - 1,
        size: itemsPerPage,
        sortBy: sortByMap[sortBy] || "createdAt",
        sortDir: "desc",
      };

      const data =
        user && user.role === "ADMIN"
          ? await projectService.getAllProjects(params)
          : await projectService.getProjects(params);
      setProjects(data.content.map(toProject));
      setTotalItems(data.totalElements);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setLoadError("Impossible de charger les projets. Vérifiez votre connexion puis réessayez.");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, currentPage, debouncedSearch, sortBy, user]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, sortBy, debouncedSearch, viewMode]);

  // Fetch stats and refresh them regularly
  const fetchStats = React.useCallback(async () => {
    try {
      const s = await projectService.getDashboardStats();
      setStats({
        total: s.totalProjects,
        created: s.projectsCreated,
        inProgress: s.projectsInProgress,
        completed: s.projectsCompleted,
        cancelled: s.projectsCancelled,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  // Initial load and periodic refresh
  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useLiveRefresh({
    userId: user?.userId,
    token: localStorage.getItem("accessToken"),
    intervalMs: 8000,
    onRefresh: async () => {
      await Promise.all([fetchProjects(), fetchStats()]);
    },
  });

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasFilters = activeStatus !== "all" || debouncedSearch.length > 0;

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleCreateProject = async (data: any) => {
    try {
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      await projectService.createProject({
        name: data.name,
        description: data.description,
        location: data.location,
        latitude: isValidProjectCoordinates(lat, lon) ? lat : undefined,
        longitude: isValidProjectCoordinates(lat, lon) ? lon : undefined,
        peakPower: parseFloat(data.peakPower) || 0,
        availableArea: parseFloat(data.availableArea) || 0,
        inclination: parseFloat(data.inclination) || 35,
        orientation: parseFloat(data.orientation) || 0,
        budget: parseFloat(data.budget) || 0,
        clientId: data.client ? parseInt(data.client) : undefined,
      });
      await fetchProjects();
      toast.success("Projet créé avec succès.");
      return true;
    } catch (err) {
      console.error("Error creating project:", err);
      toast.error("Échec de création du projet.");
      return false;
    }
  };

  // Show empty state if no projects exist
  const showEmptyState = !loading && projects.length === 0 && activeStatus === "all";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-secondary">Projets</h1>
              <p className="text-muted-foreground mt-1">
                Gérez tous vos projets de dimensionnement solaire
              </p>
              {!loading && totalItems > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {totalItems} projet{totalItems > 1 ? "s" : ""}
                  {hasFilters ? " filtré(s)" : " au total"}
                </p>
              )}
            </div>

            {!showEmptyState && (
              <button
                onClick={handleNewProject}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau projet
              </button>
            )}
          </div>

          {showEmptyState ? (
            <ProjectEmptyState onCreateProject={handleNewProject} />
          ) : (
            <>
              {loading ? (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm animate-pulse">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="h-12 w-full lg:max-w-xl rounded-xl bg-slate-200" />
                      <div className="h-5 w-40 rounded bg-slate-200" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
                    <div className="h-10 bg-slate-100 rounded-lg mb-4" />
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="h-12 bg-slate-100 rounded-lg" />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="relative w-full lg:max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Rechercher un projet, un client ou une ville..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        />
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {`${projects.length} résultat${projects.length > 1 ? "s" : ""} sur cette page`}
                      </div>
                    </div>
                  </div>

                  {loadError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm flex items-center justify-between gap-3">
                      <span>{loadError}</span>
                      <button
                        type="button"
                        onClick={fetchProjects}
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Réessayer
                      </button>
                    </div>
                  )}

                  {/* Stats Cards */}
                  <ProjectStatsCards stats={stats} />

                  {/* Filter Bar */}
                  <ProjectFilterBar
                    activeStatus={activeStatus}
                    onStatusChange={setActiveStatus}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />

                  {/* Projects Table */}
                  <ProjectsTable
                    projects={projects}
                    onProjectClick={handleProjectClick}
                    viewMode={viewMode}
                  />

                  {/* Pagination */}
                  {totalItems > 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}