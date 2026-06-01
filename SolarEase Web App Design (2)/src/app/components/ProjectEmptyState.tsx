import React from "react";
import { Plus } from "lucide-react";

interface ProjectEmptyStateProps {
  onCreateProject: () => void;
}

export function ProjectEmptyState({ onCreateProject }: ProjectEmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-20">
      <div className="max-w-md mx-auto text-center px-6">
        {/* Illustration */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {/* Solar Panel Illustration */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Panel Base */}
              <rect
                x="20"
                y="30"
                width="80"
                height="60"
                rx="4"
                fill="#E5E7EB"
                stroke="#9CA3AF"
                strokeWidth="2"
              />
              {/* Grid lines */}
              <line
                x1="60"
                y1="30"
                x2="60"
                y2="90"
                stroke="#9CA3AF"
                strokeWidth="1.5"
              />
              <line
                x1="20"
                y1="60"
                x2="100"
                y2="60"
                stroke="#9CA3AF"
                strokeWidth="1.5"
              />
              {/* Plus Icon Circle */}
              <circle cx="80" cy="40" r="18" fill="#2ECC71" />
              <line
                x1="80"
                y1="32"
                x2="80"
                y2="48"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="72"
                y1="40"
                x2="88"
                y2="40"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <h3 className="text-xl font-semibold text-secondary mb-2">
          Aucun projet pour le moment
        </h3>
        <p className="text-muted-foreground mb-6">
          Créez votre premier projet de dimensionnement solaire et commencez à
          suivre vos installations photovoltaïques.
        </p>

        {/* CTA Button */}
        <button
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Créer mon premier projet
        </button>
      </div>
    </div>
  );
}
