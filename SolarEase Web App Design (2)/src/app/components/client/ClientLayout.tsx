import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation, Link } from "react-router";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Bell,
  CreditCard,
  MessageSquare,
  User,
  LifeBuoy,
  LogOut,
  FileQuestion,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import notificationService from "../../services/notificationService";
import {
  connectWebSocket,
  releaseWebSocketConnection,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from "../../services/websocketService";

const navItems = [
  { path: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/client/projects", label: "Mes projets", icon: FolderKanban },
  { path: "/client/quotes", label: "Devis", icon: FileText },
  { path: "/client/requests", label: "Mes demandes", icon: FileQuestion },
  { path: "/client/billing", label: "Facturation", icon: CreditCard },
  { path: "/client/messages", label: "Messages", icon: MessageSquare },
  { path: "/client/notifications", label: "Notifications", icon: Bell },
  { path: "/client/profile", label: "Profil", icon: User },
  { path: "/client/support", label: "Support", icon: LifeBuoy },
];

export function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = () => {
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
  };

  // Initial WS setup and first fetch
  useEffect(() => {
    if (!user?.userId) return;
    refreshUnreadCount();
    const token = localStorage.getItem("accessToken");
    const onNotif = () => {
      setUnreadCount((prev) => prev + 1);
    };
    if (token) {
      subscribeToNotifications(user.userId, onNotif);
      connectWebSocket(user.userId, token);
    }
    return () => {
      unsubscribeFromNotifications(onNotif);
      releaseWebSocketConnection();
    };
  }, [user?.userId]);

  // Re-sync unread count on every route change (catches mark-as-read on notifications page)
  useEffect(() => {
    if (!user?.userId) return;
    refreshUnreadCount();
  }, [location.pathname, user?.userId]);

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
            const isNotif = item.path === "/client/notifications";
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
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
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
          <div className="flex items-center gap-4">
            <Link to="/client/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <span className="text-sm text-muted-foreground">Bienvenue, {user?.firstName || "client"}</span>
          </div>
        </header>

        <section className="p-8">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
