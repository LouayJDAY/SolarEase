import { useState, useEffect } from "react";
import { Search, Filter, Plus, MapPin, User } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { StatusBadge } from "../components/StatusBadge";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Project,
  Client,
  ProjectStatus,
} from "../data/mockData";
import { ProjectService, ClientService } from "../services/api";

export function ProjectsDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsData, clientsData] = await Promise.all([
        ProjectService.getAllProjects(),
        ClientService.getAllClients()
      ]);
      setProjects(projectsData);
      setClients(clientsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const getClientById = (id: string | number) => {
    return clients.find(c => String(c.id) === String(id));
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = async (newProject: {
    title: string;
    description: string;
    location: string;
    clientId: string;
    status: ProjectStatus;
  }) => {
    try {
      const createdProject = await ProjectService.createProject(newProject);
      setProjects([createdProject, ...projects]);
      fetchData(); // Refresh to ensure consistency
      setIsCreateDialogOpen(false);
    } catch (error) {
       console.error("Failed to create project", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-slate-900 mb-2">Projects Overview</h1>
          <p className="text-slate-600">
            Manage and track all your solar installation projects
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            {/* Filter by Status */}
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-lg">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New Project Button */}
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const client = getClientById(project.clientId);
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-slate-100"
              >
                {/* Status Badge */}
                <div className="mb-4">
                  <StatusBadge status={project.status} />
                </div>

                {/* Project Title */}
                <h3 className="text-lg text-slate-900 mb-3 line-clamp-2">
                  {project.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-2 text-slate-600 mb-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">{project.location}</span>
                </div>

                {/* Client */}
                <div className="flex items-center gap-2 text-slate-600 mb-4">
                  <User className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">
                    {client
                        ? `${client.firstName} ${client.lastName}`
                        : "Unknown Client"}
                  </span>
                </div>

                {/* Description Preview */}
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {project.description}
                </p>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>


        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg text-slate-900 mb-2">No projects found</h3>
            <p className="text-slate-600 mb-4">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first project"}
            </p>
            {!searchQuery && statusFilter === "ALL" && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateProject={handleCreateProject}
        clients={clients}
      />
    </DashboardLayout>
  );
}
