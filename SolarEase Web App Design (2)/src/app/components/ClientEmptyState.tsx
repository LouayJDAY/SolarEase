import React from "react";
import { Plus } from "lucide-react";

interface ClientEmptyStateProps {
  onAddClient: () => void;
}

export function ClientEmptyState({ onAddClient }: ClientEmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-24">
      <div className="max-w-md mx-auto text-center px-6">
        {/* Illustration */}
        <div className="mb-8 flex justify-center">
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Solar Panel in background */}
            <rect
              x="75"
              y="55"
              width="50"
              height="35"
              rx="3"
              fill="#E5E7EB"
              stroke="#9E9E9E"
              strokeWidth="1.5"
            />
            <line
              x1="100"
              y1="55"
              x2="100"
              y2="90"
              stroke="#9E9E9E"
              strokeWidth="1"
            />
            <line
              x1="75"
              y1="72.5"
              x2="125"
              y2="72.5"
              stroke="#9E9E9E"
              strokeWidth="1"
            />

            {/* Person 1 */}
            <circle cx="35" cy="50" r="12" fill="#2ECC71" opacity="0.3" />
            <circle cx="35" cy="50" r="8" fill="#2ECC71" />
            <path
              d="M20 90 C20 75, 25 68, 35 68 C45 68, 50 75, 50 90"
              fill="#2ECC71"
              opacity="0.3"
            />

            {/* Person 2 */}
            <circle cx="65" cy="55" r="12" fill="#9E9E9E" opacity="0.3" />
            <circle cx="65" cy="55" r="8" fill="#9E9E9E" />
            <path
              d="M50 95 C50 80, 55 73, 65 73 C75 73, 80 80, 80 95"
              fill="#9E9E9E"
              opacity="0.3"
            />

            {/* Handshake - Arms */}
            <path
              d="M45 75 L55 70"
              stroke="#2ECC71"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M55 70 L60 75"
              stroke="#9E9E9E"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Handshake detail */}
            <circle cx="55" cy="70" r="4" fill="#4CAF50" />
          </svg>
        </div>

        {/* Text Content */}
        <h3 className="text-xl font-bold text-secondary mb-3">
          Aucun client pour le moment
        </h3>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Ajoutez votre premier client pour commencer à gérer vos projets
          solaires
        </p>

        {/* CTA Button */}
        <button
          onClick={onAddClient}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Ajouter mon premier client
        </button>
      </div>
    </div>
  );
}
