import React from "react";

export type ProjectStatus =
  | "CREATED"
  | "EN_PREPARATION"
  | "INSTALLATEUR_AFFECTE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

interface StatusBadgeProps {
  status: ProjectStatus | string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    CREATED: {
      label: "Créé",
      color: "bg-gray-100 text-gray-700 border-gray-200",
    },
    EN_PREPARATION: {
      label: "En préparation",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    },
    INSTALLATEUR_AFFECTE: {
      label: "Installateur affecté",
      color: "bg-purple-100 text-purple-700 border-purple-200",
    },
    IN_PROGRESS: {
      label: "En cours",
      color: "bg-orange-100 text-orange-700 border-orange-200",
    },
    COMPLETED: {
      label: "Terminé",
      color: "bg-primary/10 text-primary border-primary/20",
    },
    CANCELLED: {
      label: "Annulé",
      color: "bg-red-100 text-red-700 border-red-200",
    },
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const config = statusConfig[status] ?? { label: status, color: "bg-gray-100 text-gray-700 border-gray-200" };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
