import React from "react";
import {
  MapPin,
  MoreVertical,
  User,
  Download,
  Edit,
  Trash2,
} from "lucide-react";

export interface Project {
  id: string;
  name: string;
  projectId: string;
  client: {
    name: string;
    avatar?: string;
  };
  location: string;
  systemSize: string;
  status: "draft" | "study" | "installation" | "completed";
  progress: number;
  startDate?: string;
}

interface ProjectsTableProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
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
  installation: {
    label: "En cours",
    color: "bg-blue-100 text-blue-700",
  },
  completed: {
    label: "Terminé",
    color: "bg-green-100 text-green-700",
  },
};

export function ProjectsTable({ projects, onProjectClick }: ProjectsTableProps) {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div className="col-span-3">Nom du projet</div>
        <div className="col-span-2">Client</div>
        <div className="col-span-2">Localisation</div>
        <div className="col-span-1">Puissance (kWc)</div>
        <div className="col-span-2">Statut</div>
        <div className="col-span-1">Date de création</div>
        <div className="col-span-1 text-center">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {projects.map((project) => (
          <div
            key={project.id}
            className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
            onClick={() => onProjectClick?.(project)}
          >
            {/* Project Name */}
            <div className="col-span-3">
              <p className="font-semibold text-secondary">{project.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {project.projectId}
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

            {/* Location */}
            <div className="col-span-2 flex items-center gap-2 text-sm text-secondary">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{project.location}</span>
            </div>

            {/* System Size */}
            <div className="col-span-1 flex items-center">
              <span className="px-2 py-1 bg-primary/5 text-primary rounded text-xs font-medium">
                {project.systemSize}
              </span>
            </div>

            {/* Status */}
            <div className="col-span-2 flex items-center">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  statusConfig[project.status].color
                }`}
              >
                {statusConfig[project.status].label}
              </span>
            </div>

            {/* Date de création */}
            <div className="col-span-1 flex items-center">
              <span className="text-sm text-secondary">
                {project.startDate || "-"}
              </span>
            </div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(
                      openMenuId === project.id ? null : project.id
                    );
                  }}
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Dropdown Menu */}
                {openMenuId === project.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Edit", project.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Modifier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Download", project.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exporter
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Delete", project.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-secondary font-medium">Aucun projet trouvé</p>
          <p className="text-muted-foreground text-sm mt-1">
            Essayez de modifier vos filtres ou créez un nouveau projet
          </p>
        </div>
      )}
    </div>
  );
}