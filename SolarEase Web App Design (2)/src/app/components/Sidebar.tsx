import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, FolderKanban, Users, Package, Settings, LogOut, FileText, Receipt, Inbox } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import projectService from "../services/projectService";
import { subscribeToAdminDemands } from "../services/websocketService";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [pendingDemands, setPendingDemands] = useState<number>(0);

  // Poll the admin KPI every 60s for the "Demandes" badge, and bump it instantly
  // when a new demand arrives over STOMP.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;

    const fetchPending = async () => {
      try {
        const stats = await projectService.getDashboardStats();
        if (!cancelled) {
          setPendingDemands(stats.pendingDemandsCount ?? 0);
        }
      } catch {
        // best-effort -- silent
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 60_000);

    // Optimistic increment when a brand new demand arrives. The next poll will reconcile.
    subscribeToAdminDemands((event) => {
      if (event.event === "DEMAND_CREATED") {
        setPendingDemands((c) => c + 1);
      }
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAdmin]);

  const navItems: Array<{
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/projects",  label: "Projets",   icon: FolderKanban },
    { path: "/quotes",    label: "Devis",     icon: FileText },
    {
      path: "/requests",
      label: "Demandes",
      icon: Inbox,
      badge: isAdmin && pendingDemands > 0 ? pendingDemands : undefined,
    },
    { path: "/invoices",  label: "Factures",  icon: Receipt },
    { path: "/clients",   label: "Clients",   icon: Users },
    { path: "/catalog",   label: "Catalogue", icon: Package },
    { path: "/settings",  label: "Paramètres", icon: Settings },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fn = user?.firstName || "";
  const ln = user?.lastName || "";
  const initials = fn && ln
    ? `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase()
    : "SE";

  const fullName = fn ? `${fn} ${ln}`.trim() : "SolarEase";
  const workspaceLabel = isAdmin ? "Espace administrateur" : "Espace installateur";
  const userRoleLabel = isAdmin ? "Administrateur" : "Installateur Pro";

  return (
    <aside className="w-64 bg-white/95 backdrop-blur border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 shadow-[0_0_30px_rgba(15,23,42,0.04)]">
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-secondary leading-tight">SolarEase</h1>
            <p className="text-xs text-muted-foreground">{workspaceLabel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? "text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 hover:text-secondary"
              }`}
              style={active ? { backgroundColor: "#4CAF50" } : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span
                  className={`min-w-[1.5rem] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                    active
                      ? "bg-white text-secondary"
                      : "bg-red-500 text-white animate-pulse"
                  }`}
                  title={`${item.badge} demande(s) à traiter`}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: "#4CAF50" }}>
            <span className="text-sm font-medium text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{userRoleLabel}</p>
          </div>
          <button
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Déconnexion"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
