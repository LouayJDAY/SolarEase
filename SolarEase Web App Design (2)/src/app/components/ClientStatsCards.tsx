import React from "react";
import { User, Folder, Clock } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

function StatsCard({ title, value, icon, bgColor }: StatsCardProps) {
  return (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-200 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-secondary">{value}</p>
        </div>
        <div className="p-3 bg-white/50 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}

interface ClientStatsCardsProps {
  stats: {
    totalClients: number;
    totalProjects: number;
    addedThisMonth: number;
  };
}

export function ClientStatsCards({ stats }: ClientStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard
        title="Total Clients"
        value={stats.totalClients}
        icon={<User className="w-6 h-6 text-gray-600" />}
        bgColor="bg-gray-50"
      />
      <StatsCard
        title="Projets associés"
        value={stats.totalProjects}
        icon={<Folder className="w-6 h-6 text-blue-600" />}
        bgColor="bg-blue-50"
      />
      <StatsCard
        title="Ajoutés ce mois"
        value={stats.addedThisMonth}
        icon={<Clock className="w-6 h-6 text-green-600" />}
        bgColor="bg-green-50"
      />
    </div>
  );
}
