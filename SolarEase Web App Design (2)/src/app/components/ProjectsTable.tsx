import React from "react";
import { User } from "lucide-react";

export interface Project {
  id: string;
  name: string;
  projectId: string;
  client: {
    name: string;
    avatar?: string;
  };
  installer: {
    name: string;
    avatar?: string;
  };
  assignedBy?: string;
  location: string;
  systemSize: string;
  status: "draft" | "study" | "inProgress" | "installation" | "completed";
  progress: number;
  startDate?: string;
}

interface ProjectsTableProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  viewMode?: "table" | "grid";
}

const statusConfig = {
  draft: {
    label: "Créé",
    color: "bg-gray-100 text-gray-700",
  },
  study: {
    label: "En cours",
    color: "bg-blue-100 text-blue-700",
  },
  inProgress: {
    label: "En cours",
    color: "bg-blue-100 text-blue-700",
  },
  installation: {
    label: "En cours",
    color: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Terminé",
    color: "bg-green-100 text-green-700",
  },
};

export function ProjectsTable({ projects, onProjectClick, viewMode = "table" }: ProjectsTableProps) {
  const getStatusConfig = (status: Project["status"]) => statusConfig[status] ?? statusConfig.draft;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {viewMode === "grid" ? (
        <div className="p-4 md:p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectClick?.(project)}
              className="group cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/80 p-5 hover:bg-white hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-secondary group-hover:text-primary transition-colors">{project.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{project.projectId}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusConfig(project.status).color}`}>
                  {getStatusConfig(project.status).label}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Client</span>
                  <span className="text-secondary font-medium truncate">{project.client.name}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Localisation</span>
                  <span className="text-secondary font-medium truncate">{project.location}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Puissance</span>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">{project.systemSize}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-muted-foreground">
                <span>{project.startDate || "—"}</span>
                <span>{project.progress}% avancé</span>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-secondary font-medium">Aucun projet trouvé</p>
              <p className="text-muted-foreground text-sm mt-1">
                Essayez de modifier vos filtres ou créez un nouveau projet
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div className="col-span-3">Nom du projet</div>
        <div className="col-span-2">Client</div>
        <div className="col-span-2">Installateur</div>
        <div className="col-span-2">Affecté par</div>
        <div className="col-span-1">Puissance (kWc)</div>
        <div className="col-span-1">Statut</div>
        <div className="col-span-1">Date</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100">
        {projects.map((project) => (
          <div
            key={project.id}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
            onClick={() => onProjectClick?.(project)}
          >
            {/* Project Name */}
            <div className="col-span-3">
              <p className="font-semibold text-secondary">{project.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {project.projectId}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {project.location}
              </p>
            </div>

            {/* Client */}
            <div className="col-span-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {project.client.avatar ? (
                  <img
                    src={project.client.avatar}
                    alt={project.client.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-primary">
                    {getInitials(project.client.name)}
                  </span>
                )}
              </div>
              <span className="text-sm text-secondary truncate">
                {project.client.name}
              </span>
            </div>

            {/* Installer */}
            <div className="col-span-2 flex items-center gap-2 text-sm text-secondary">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{project.installer.name}</span>
            </div>

            {/* Assigned by admin */}
            <div className="col-span-2 flex items-center gap-2 text-sm text-secondary">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{project.assignedBy || "—"}</span>
            </div>

            {/* System Size */}
            <div className="col-span-1 flex items-center">
              <span className="px-2 py-1 bg-primary/5 text-primary rounded text-xs font-medium">
                {project.systemSize}
              </span>
            </div>

            {/* Status */}
            <div className="col-span-1 flex items-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  getStatusConfig(project.status).color
                }`}
              >
                {getStatusConfig(project.status).label}
              </span>
            </div>

            {/* Date de création */}
            <div className="col-span-1 flex items-center">
              <span className="text-sm text-secondary">
                {project.startDate || "-"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-secondary font-medium">Aucun projet trouvé</p>
          <p className="text-muted-foreground text-sm mt-1">
            Essayez de modifier vos filtres ou créez un nouveau projet
          </p>
        </div>
      )}
        </>
      )}
    </div>
  );
}