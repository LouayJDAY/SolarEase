import React from "react";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router";

interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: "quote" | "in-study" | "approved" | "in-progress" | "completed";
  date: string;
  timeAgo: string;
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Villa Ben Ali",
    client: "M. Ahmed Ben Ali",
    location: "Sousse",
    status: "in-study",
    date: "2024-02-24",
    timeAgo: "Il y a 2h"
  },
  {
    id: "2",
    name: "Hôtel Méditerranée",
    client: "Hôtel Méditerranée SARL",
    location: "Hammamet",
    status: "approved",
    date: "2024-02-23",
    timeAgo: "Hier"
  },
  {
    id: "3",
    name: "Usine Textile Sfax",
    client: "Textile Industries",
    location: "Sfax",
    status: "in-progress",
    date: "2024-02-22",
    timeAgo: "Il y a 2 jours"
  },
  {
    id: "4",
    name: "Résidence Al Yasmine",
    client: "Mme Fatima Trabelsi",
    location: "Monastir",
    status: "quote",
    date: "2024-02-21",
    timeAgo: "Il y a 3 jours"
  },
  {
    id: "5",
    name: "Centre Commercial Carthage",
    client: "Carthage Mall Group",
    location: "Tunis",
    status: "completed",
    date: "2024-02-20",
    timeAgo: "Il y a 4 jours"
  }
];

export function RecentProjects() {
  const getStatusBadge = (status: Project["status"]) => {
    const variants = {
      quote: { bg: "bg-gray-100", text: "text-gray-800", label: "Devis" },
      "in-study": { bg: "bg-blue-100", text: "text-blue-800", label: "Étude Terminée" },
      approved: { bg: "bg-purple-100", text: "text-purple-800", label: "Approuvé" },
      "in-progress": { bg: "bg-orange-100", text: "text-orange-800", label: "En cours" },
      completed: { bg: "bg-green-100", text: "text-green-800", label: "Terminé" }
    };

    const variant = variants[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${variant.bg} ${variant.text}`}>
        {variant.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-secondary">Projets Récents</h3>
        <p className="text-sm text-muted-foreground mt-1">Activité récente</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {mockProjects.map((project) => (
            <div 
              key={project.id} 
              className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-secondary truncate">{project.name}</h4>
                  <p className="text-sm text-muted-foreground truncate mt-1">{project.client}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{project.location}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    {getStatusBadge(project.status)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{project.timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
