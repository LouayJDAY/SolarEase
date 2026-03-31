import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { LayoutDashboard, FolderKanban, Users, Package, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/projects", label: "Projets", icon: FolderKanban },
    { path: "/clients", label: "Clients", icon: Users },
    { path: "/catalog", label: "Catalogue", icon: Package },
    { path: "/settings", label: "Paramètres", icon: Settings },
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

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-secondary">SolarEase</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? "text-white shadow-md"
                  : "text-muted-foreground hover:bg-gray-100 hover:text-secondary"
              }`}
              style={active ? { backgroundColor: "#4CAF50", borderLeft: "4px solid #2E7D32" } : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#4CAF50" }}>
            <span className="text-sm font-medium text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">Installateur Pro</p>
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