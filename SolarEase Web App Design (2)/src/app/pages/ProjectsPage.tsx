import React from "react";
import { useNavigate } from "react-router";
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

// Map backend status to frontend status
function mapStatus(s: string): Project["status"] {
  const map: Record<string, Project["status"]> = {
    CREATED: "draft",
    IN_PROGRESS: "installation",
    COMPLETED: "completed",
    CANCELLED: "draft",
  };
  return map[s] || "draft";
}

function toProject(p: ProjectResponse): Project {
  return {
    id: String(p.id),
    name: p.name,
    projectId: `PRJ-${p.id}`,
    client: { name: p.client ? `${p.client.firstName} ${p.client.lastName}` : "—" },
    location: p.location,
    systemSize: p.peakPower ? `${p.peakPower} kWc` : "—",
    status: mapStatus(p.status),
    progress: p.status === "COMPLETED" ? 100 : p.status === "IN_PROGRESS" ? 50 : p.status === "CREATED" ? 10 : 0,
    startDate: new Date(p.createdAt).toLocaleDateString("fr-FR"),
  };
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeStatus, setActiveStatus] = React.useState<ProjectStatus>("all");
  const [sortBy, setSortBy] = React.useState<SortOption>("date");
  const [viewMode, setViewMode] = React.useState<ViewMode>("table");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [stats, setStats] = React.useState({ total: 0, inProgress: 0, completed: 0, cancelled: 0 });
  const itemsPerPage = 6;

  const fetchProjects = React.useCallback(async () => {
    try {
      setLoading(true);
      // Map frontend status filter to backend status
      let statusParam: string | undefined;
      if (activeStatus === "draft") statusParam = "CREATED";
      else if (activeStatus === "inProgress") statusParam = "IN_PROGRESS";
      else if (activeStatus === "completed") statusParam = "COMPLETED";
      else if (activeStatus === "cancelled") statusParam = "CANCELLED";

      const sortByMap: Record<string, string> = { date: "createdAt", name: "name", client: "createdAt" };

      const data = await projectService.getProjects({
        status: statusParam,
        page: currentPage - 1,
        size: itemsPerPage,
        sortBy: sortByMap[sortBy] || "createdAt",
        sortDir: "desc",
      });
      setProjects(data.content.map(toProject));
      setTotalItems(data.totalElements);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, currentPage, sortBy]);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch stats
  React.useEffect(() => {
    projectService.getDashboardStats().then((s) => {
      setStats({
        total: s.totalProjects,
        inProgress: s.projectsInProgress,
        completed: s.projectsCompleted,
        cancelled: s.projectsCancelled,
      });
    }).catch(console.error);
  }, []);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleNewProject = () => {
    setIsModalOpen(true);
  };

  const handleCreateProject = async (data: any) => {
    try {
      await projectService.createProject({
        name: data.name,
        description: data.description,
        location: data.location,
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        peakPower: parseFloat(data.peakPower) || 0,
        availableArea: parseFloat(data.availableArea) || 0,
        inclination: parseFloat(data.inclination) || 35,
        orientation: parseFloat(data.orientation) || 0,
        budget: parseFloat(data.budget) || 0,
        clientId: data.client ? parseInt(data.client) : undefined,
      });
      fetchProjects();
    } catch (err) {
      console.error("Error creating project:", err);
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
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-semibold text-secondary">Projets</h1>
            <p className="text-muted-foreground mt-1">
              Gérez tous vos projets de dimensionnement solaire
            </p>
          </div>

          {showEmptyState ? (
            <ProjectEmptyState onCreateProject={handleNewProject} />
          ) : (
            <>
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