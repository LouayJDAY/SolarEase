import React from "react";
import { Folder, Clock, CheckCircle, XCircle } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

function StatsCard({ title, value, icon, bgColor, iconColor }: StatsCardProps) {
  return (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-secondary">{value}</p>
        </div>
        <div className={`${iconColor} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
}

interface ProjectStatsCardsProps {
  stats: {
    total: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

export function ProjectStatsCards({ stats }: ProjectStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Projets"
        value={stats.total}
        icon={<Folder className="w-6 h-6 text-gray-600" />}
        bgColor="bg-gray-50"
        iconColor="bg-gray-100"
      />
      <StatsCard
        title="En cours"
        value={stats.inProgress}
        icon={<Clock className="w-6 h-6 text-blue-600" />}
        bgColor="bg-blue-50"
        iconColor="bg-blue-100"
      />
      <StatsCard
        title="Terminés"
        value={stats.completed}
        icon={<CheckCircle className="w-6 h-6 text-green-600" />}
        bgColor="bg-green-50"
        iconColor="bg-green-100"
      />
      <StatsCard
        title="Annulés"
        value={stats.cancelled}
        icon={<XCircle className="w-6 h-6 text-red-600" />}
        bgColor="bg-red-50"
        iconColor="bg-red-100"
      />
    </div>
  );
}
