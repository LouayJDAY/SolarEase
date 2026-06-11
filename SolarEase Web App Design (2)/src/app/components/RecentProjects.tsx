import React, { useEffect, useState } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router";
import projectService, { ProjectResponse } from "../services/projectService";
import { StatusBadge } from "./client/StatusBadge";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Il y a ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

export function RecentProjects() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService
      .getProjects({ page: 0, size: 5, sortBy: "createdAt", sortDir: "desc" })
      .then((page) => setProjects(page.content ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-secondary">Projets Récents</h3>
        <p className="text-sm text-muted-foreground mt-1">Activité récente</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Chargement...</p>
        ) : projects.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Aucun projet récent</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-secondary truncate">{project.name}</h4>
                    {project.client && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {project.client.firstName} {project.client.lastName}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {project.location && (
                        <span className="text-xs text-muted-foreground">{project.location}</span>
                      )}
                      <StatusBadge status={project.status} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(project.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Link
          to="/projects"
          className="flex items-center justify-center gap-2 text-sm text-primary hover:text-[#27AE60] font-medium transition-colors"
        >
          Voir tous les projets
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
