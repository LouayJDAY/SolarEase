import React from "react";
import { MapPin } from "lucide-react";

interface ProjectPin {
  id: string;
  name: string;
  location: string;
  status: "done" | "in-progress" | "quote";
  position: { x: number; y: number }; // Percentage position
}

const mockProjects: ProjectPin[] = [
  { id: "1", name: "Villa Ben Ali", location: "Sousse", status: "done", position: { x: 52, y: 45 } },
  { id: "2", name: "Hôtel Méditerranée", location: "Hammamet", status: "in-progress", position: { x: 55, y: 42 } },
  { id: "3", name: "Usine Textile", location: "Monastir", status: "in-progress", position: { x: 54, y: 48 } },
  { id: "4", name: "Centre Commercial", location: "Tunis", status: "quote", position: { x: 50, y: 38 } },
  { id: "5", name: "Résidence Al Yasmine", location: "Sfax", status: "done", position: { x: 53, y: 58 } },
];

export function MapWidget() {
  const getStatusColor = (status: ProjectPin["status"]) => {
    switch (status) {
      case "done":
        return "bg-green-500";
      case "in-progress":
        return "bg-orange-500";
      case "quote":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusLabel = (status: ProjectPin["status"]) => {
    switch (status) {
      case "done":
        return "Terminé";
      case "in-progress":
        return "En cours";
      case "quote":
        return "Devis";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-secondary">Carte des Projets</h3>
        <p className="text-sm text-muted-foreground mt-1">Localisation des sites actifs</p>
      </div>

      <div className="p-6">
        {/* Map Container */}
        <div className="relative w-full h-80 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-gray-200 overflow-hidden">
          {/* Tunisia Map Placeholder - Using a simple SVG outline */}
          <svg 
            viewBox="0 0 200 200" 
            className="absolute inset-0 w-full h-full opacity-20"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          >
            <path
              d="M 100 30 L 120 40 L 130 50 L 135 70 L 130 90 L 125 110 L 120 130 L 110 145 L 95 150 L 80 145 L 70 130 L 65 110 L 62 90 L 65 70 L 75 50 L 85 40 Z"
              fill="#2C3E50"
              opacity="0.3"
            />
          </svg>

          {/* Project Pins */}
          {mockProjects.map((project) => (
            <div
              key={project.id}
              className="absolute group cursor-pointer"
              style={{ 
                left: `${project.position.x}%`, 
                top: `${project.position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Pin Icon */}
              <div className={`w-8 h-8 ${getStatusColor(project.status)} rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110`}>
                <MapPin className="w-5 h-5 text-white" fill="white" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-secondary text-white px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-sm">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs opacity-90">{project.location}</p>
                  <p className="text-xs opacity-75 mt-1">{getStatusLabel(project.status)}</p>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="w-2 h-2 bg-secondary rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Devis</span>
          </div>
        </div>
      </div>
    </div>
  );
}
