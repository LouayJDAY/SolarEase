import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  CreditCard,
  MessageSquare,
  User,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { path: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/client/projects", label: "Mes projets", icon: FolderKanban },
  { path: "/client/documents", label: "Documents", icon: FileText },
  { path: "/client/billing", label: "Facturation", icon: CreditCard },
  { path: "/client/messages", label: "Messages", icon: MessageSquare },
  { path: "/client/profile", label: "Profil", icon: User },
  { path: "/client/support", label: "Support", icon: LifeBuoy },
];

export function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (user?.role && user.role !== "CLIENT") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate, user?.role]);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "Client";
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "CL";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-200">
          <h1 className="text-2xl font-semibold text-secondary">SolarEase</h1>
          <p className="text-sm text-muted-foreground">Espace Client</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-secondary truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "client@solarease.com"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="ml-72 min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-secondary">Mon espace</h2>
          <div className="text-sm text-muted-foreground">Bienvenue, {user?.firstName || "client"}</div>
        </header>

        <section className="p-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
