import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Link } from "react-router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  FolderOpen,
  RefreshCw,
  CheckCircle,
  Users,
  Zap,
  FileText,
  UserPlus,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import projectService, { DashboardStats, ProjectResponse } from "../services/projectService";

/* ── Component ───────────────────────────────────────────────── */

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, projectsData] = await Promise.all([
          projectService.getDashboardStats(),
          projectService.getProjects({ page: 0, size: 5, sortBy: "createdAt", sortDir: "desc" }),
        ]);
        setStats(statsData);
        setRecentProjects(projectsData.content);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; color: string }> = {
      CREATED: { label: "Créé", color: "#9E9E9E" },
      IN_PROGRESS: { label: "En cours", color: "#FF9800" },
      COMPLETED: { label: "Terminé", color: "#4CAF50" },
      CANCELLED: { label: "Annulé", color: "#F44336" },
    };
    return map[s] || { label: s, color: "#9E9E9E" };
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    return `Il y a ${diff} jours`;
  };

  const kpiCards = stats
    ? [
        { icon: FolderOpen, value: stats.totalProjects, label: "Total Projets", trend: "", trendColor: "#4CAF50", iconBg: "#E8F5E9", iconColor: "#4CAF50" },
        { icon: RefreshCw, value: stats.projectsInProgress, label: "En Cours", trend: "", trendColor: "#2196F3", iconBg: "#E3F2FD", iconColor: "#2196F3" },
        { icon: CheckCircle, value: stats.projectsCompleted, label: "Terminés", trend: "", trendColor: "#4CAF50", iconBg: "#E8F5E9", iconColor: "#4CAF50" },
        { icon: Users, value: stats.totalClients, label: "Total Clients", trend: "", trendColor: "#FF9800", iconBg: "#FFF3E0", iconColor: "#FF9800" },
      ]
    : [];

  const donutData = stats
    ? [
        { name: "En cours", value: stats.projectsInProgress, color: "#2196F3" },
        { name: "Terminés", value: stats.projectsCompleted, color: "#4CAF50" },
        { name: "Créés", value: stats.projectsCreated, color: "#BDBDBD" },
        { name: "Annulés", value: stats.projectsCancelled, color: "#F44336" },
      ].filter((d) => d.value > 0)
    : [];

  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  const barData = monthNames.map((month) => ({ month, projets: 0 }));
  // Fill current month with total projects count if available
  if (stats) {
    const currentMonth = new Date().getMonth();
    barData[currentMonth].projets = stats.totalProjects;
  }

  // Map points based on real project coordinates
  const geolocatedProjects = recentProjects.filter(
    (p) =>
      Number.isFinite(p.latitude) &&
      Number.isFinite(p.longitude) &&
      Math.abs(p.latitude) <= 90 &&
      Math.abs(p.longitude) <= 180
  );

  const tunisiaCenter: [number, number] = [34.0, 9.5];
  const tunisiaBounds: [[number, number], [number, number]] = [
    [30.0, 7.0],
    [38.8, 12.5],
  ];

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* ── Section 1 – Welcome Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bonjour, {user?.firstName || "Utilisateur"} 👋
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Voici un résumé de votre activité
              </p>
            </div>
            <span className="text-sm text-gray-500 capitalize">{today}</span>
          </div>

          {/* ── Section 2 – KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: c.iconBg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: c.iconColor }} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{c.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{c.label}</p>
                  <p
                    className="text-xs font-medium mt-2"
                    style={{ color: c.trendColor }}
                  >
                    {c.trend}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── Section 3 – Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart – Projets par mois */}
            <div
              className="bg-white rounded-xl p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">
                  Projets par mois
                </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="20%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#F0F0F0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9E9E9E", fontSize: 13 }}
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9E9E9E", fontSize: 13 }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(76,175,80,0.08)" }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="projets"
                      fill="#4CAF50"
                      radius={[6, 6, 0, 0]}
                      barSize={32}
                      name="Projets"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Donut chart – Répartition par statut */}
            <div
              className="bg-white rounded-xl p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">
                  Répartition par statut
                </h3>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-52 h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {donutData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">{stats?.totalProjects || 0}</span>
                    <span className="text-xs text-gray-400">Total</span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
                  {donutData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-sm text-gray-600">
                        {d.name} {d.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 4 – Map & Recent Projects (40 / 60) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Map – Localisation des projets */}
            <div
              className="lg:col-span-2 bg-white rounded-xl p-6"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <h3 className="font-semibold text-gray-900 mb-4">
                Localisation des projets
              </h3>
              <div
                className="relative bg-gray-50 rounded-lg overflow-hidden"
                style={{ height: 320 }}
              >
                <MapContainer
                  center={tunisiaCenter}
                  zoom={6}
                  minZoom={5}
                  maxZoom={18}
                  maxBounds={tunisiaBounds}
                  maxBoundsViscosity={1.0}
                  scrollWheelZoom={false}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {geolocatedProjects.map((p) => {
                    const st = statusLabel(p.status);
                    return (
                      <CircleMarker
                        key={p.id}
                        center={[p.latitude, p.longitude]}
                        radius={8}
                        pathOptions={{
                          fillColor: st.color,
                          color: "#ffffff",
                          weight: 2,
                          fillOpacity: 0.95,
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            <p className="text-gray-600">{p.location || "Sans localisation"}</p>
                            <p className="text-gray-500 mt-1">Statut: {st.label}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>

                {geolocatedProjects.length === 0 && (
                  <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-2 text-xs text-gray-600">
                      Aucun projet avec coordonnées GPS disponible
                    </div>
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-5 mt-4">
                {[
                  { label: "Terminé", color: "#4CAF50" },
                  { label: "En cours", color: "#FF9800" },
                  { label: "Créé", color: "#9E9E9E" },
                  { label: "Annulé", color: "#F44336" },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-xs text-gray-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Projects */}
            <div
              className="lg:col-span-3 bg-white rounded-xl flex flex-col"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="font-semibold text-gray-900">
                  Projets Récents
                </h3>
              </div>
              <div className="flex-1 divide-y divide-gray-50">
                {recentProjects.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-gray-400">
                    Aucun projet pour le moment
                  </div>
                ) : (
                  recentProjects.map((p) => {
                    const st = statusLabel(p.status);
                    return (
                      <Link
                        to={`/projects/${p.id}`}
                        key={p.id}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                            style={{ backgroundColor: st.color }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {p.client
                                ? `${p.client.firstName} ${p.client.lastName}`
                                : "—"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs text-gray-400">
                                {p.location}
                              </span>
                              <span className="text-xs text-gray-300">•</span>
                              <span
                                className="text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  color: st.color,
                                  backgroundColor: st.color + "18",
                                }}
                              >
                                {st.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 ml-3">
                          {formatDate(p.createdAt)}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
              <div className="px-6 py-3.5 border-t border-gray-100 text-center">
                <Link
                  to="/projects"
                  className="text-sm font-medium hover:underline"
                  style={{ color: "#4CAF50" }}
                >
                  Voir tous les projets →
                </Link>
              </div>
            </div>
          </div>

          {/* ── Section 5 – Quick Actions ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
            {[
              {
                icon: Zap,
                title: "Nouvelle Étude",
                sub: "Lancer une étude de dimensionnement",
                border: "#4CAF50",
                bg: "#E8F5E9",
                fg: "#4CAF50",
              },
              {
                icon: FileText,
                title: "Nouveau Projet",
                sub: "Créer un nouveau projet solaire",
                border: "#FF9800",
                bg: "#FFF3E0",
                fg: "#FF9800",
              },
              {
                icon: UserPlus,
                title: "Ajouter un Client",
                sub: "Créer une fiche client",
                border: "#2196F3",
                bg: "#E3F2FD",
                fg: "#2196F3",
              },
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    borderLeft: `4px solid ${a.border}`,
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: a.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: a.fg }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {a.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}