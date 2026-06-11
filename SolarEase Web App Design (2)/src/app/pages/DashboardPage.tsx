import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Link, useNavigate } from "react-router";
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
  FileText,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import projectService, { DashboardStats, ProjectResponse } from "../services/projectService";
import { useDashboardLive } from "../hooks/useDashboardLive";

/* ── Component ───────────────────────────────────────────────── */

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [wsLive, setWsLive] = useState(false);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (user?.role === "CLIENT") {
      navigate("/client/dashboard", { replace: true });
    }
  }, [user?.role, navigate]);

  const fetchDashboard = useCallback(async () => {
    const isInitialLoad = initialLoadRef.current;
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const isAdmin = user?.role === "ADMIN";
      const [statsData, projectsData] = await Promise.all([
        projectService.getDashboardStats(),
        isAdmin
          ? projectService.getAllProjects({ page: 0, size: 5 })
          : projectService.getProjects({ page: 0, size: 5, sortBy: "createdAt", sortDir: "desc" }),
      ]);
      setStats(statsData);
      setRecentProjects(projectsData.content);
      setLastSyncedAt(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      initialLoadRef.current = false;
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user?.userId) return;
    void fetchDashboard();
  }, [user?.userId, user?.role, fetchDashboard]);

  useDashboardLive({
    userId: user?.userId ?? null,
    token: localStorage.getItem("accessToken"),
    isAdmin: user?.role === "ADMIN",
    enabled: Boolean(user?.userId),
    onRefresh: fetchDashboard,
    onConnected: () => setWsLive(true),
    onDisconnected: () => setWsLive(false),
  });

  // Fallback polling when WebSocket is unavailable (every 30s)
  useEffect(() => {
    if (!user?.userId || wsLive) return;
    const interval = setInterval(() => {
      void fetchDashboard();
    }, 30_000);
    return () => clearInterval(interval);
  }, [user?.userId, wsLive, fetchDashboard]);

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; color: string }> = {
      CREATED: { label: "Créé", color: "#9E9E9E" },
      EN_PREPARATION: { label: "En préparation", color: "#2196F3" },
      INSTALLATEUR_AFFECTE: { label: "Installateur affecté", color: "#9C27B0" },
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

  const isAdmin = user?.role === "ADMIN";

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

  const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

  const barData = (stats?.projectsByMonth ?? []).map((entry) => ({
    month: monthLabels[entry.month - 1] ?? String(entry.month),
    projets: entry.count,
  }));

  const maxMonthlyProjects = barData.reduce((max, d) => Math.max(max, d.projets), 0);
  const yAxisMax = Math.max(5, maxMonthlyProjects + 1);

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

  const isFirstProject = (stats?.totalProjects || 0) === 0;

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
            <div className="text-right">
              <span className="text-sm text-gray-500 capitalize block">{today}</span>
              <span
                className={`text-xs font-medium mt-1 inline-flex items-center gap-1.5 ${
                  wsLive ? "text-[#4CAF50]" : "text-amber-600"
                }`}
                title={
                  wsLive
                    ? "Les KPI se mettent à jour instantanément via WebSocket"
                    : "Mode secours : rafraîchissement toutes les 30 s"
                }
              >
                {wsLive ? (
                  <Wifi className="w-3.5 h-3.5" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5" />
                )}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    wsLive ? "bg-[#4CAF50] animate-pulse" : "bg-amber-500"
                  }`}
                />
                {wsLive
                  ? `Temps réel actif${lastSyncedAt ? ` · ${lastSyncedAt}` : ""}`
                  : lastSyncedAt
                    ? `Hors ligne · ${lastSyncedAt}`
                    : "Connexion en cours…"}
              </span>
            </div>
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

          {isAdmin && stats && (
            <Link
              to="/requests?status=NOUVELLE"
              className="block bg-white rounded-xl p-5 hover:shadow-md transition-shadow group"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Demandes à traiter
                  </p>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-secondary">
                      {stats.pendingDemandsCount ?? 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      en attente
                    </span>
                    {stats.newDemandsTodayCount != null && stats.newDemandsTodayCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                        +{stats.newDemandsTodayCount} aujourd'hui
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}

          {isFirstProject && (
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-emerald-50 p-6">
              <h2 className="text-lg font-semibold text-secondary">Bienvenue sur votre dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">
                Pour démarrer rapidement, suivez ces 3 étapes: ajouter un client, créer un projet, puis lancer un dimensionnement.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <Link to="/clients" className="rounded-xl bg-white border border-slate-200 px-4 py-3 hover:shadow-sm transition-shadow">
                  <p className="text-xs text-gray-500">Étape 1</p>
                  <p className="text-sm font-medium text-secondary mt-1">Ajouter un client</p>
                </Link>
                <Link to="/projects" className="rounded-xl bg-white border border-slate-200 px-4 py-3 hover:shadow-sm transition-shadow">
                  <p className="text-xs text-gray-500">Étape 2</p>
                  <p className="text-sm font-medium text-secondary mt-1">Créer un projet</p>
                </Link>
                <Link to="/simulateur" className="rounded-xl bg-white border border-slate-200 px-4 py-3 hover:shadow-sm transition-shadow">
                  <p className="text-xs text-gray-500">Étape 3</p>
                  <p className="text-sm font-medium text-secondary mt-1">Lancer une étude</p>
                </Link>
              </div>
              <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-primary font-medium mt-4 hover:underline">
                Commencer maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

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
                  Projets créés par mois (12 derniers mois)
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
                      domain={[0, yAxisMax]}
                      allowDecimals={false}
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
        </div>
      </main>
    </div>
  );
}