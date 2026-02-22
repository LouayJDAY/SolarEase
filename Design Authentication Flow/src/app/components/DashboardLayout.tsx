import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { 
  Home, 
  Briefcase, 
  Users, 
  Settings, 
  LogOut,
  Sun
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/dashboard/projects", label: "Projects", icon: Briefcase },
  { path: "/dashboard/clients", label: "Clients", icon: Users },
  { path: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // In real implementation, clear auth tokens
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-emerald-800 to-emerald-900 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">SolarEase</h1>
              <p className="text-xs text-emerald-300">Project Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-emerald-700 text-white"
                        : "text-emerald-100 hover:bg-emerald-700/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section & Logout */}
        <div className="p-4 border-t border-emerald-700">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center">
              <span className="text-sm">JD</span>
            </div>
            <div className="flex-1">
              <p className="text-sm">John Doe</p>
              <p className="text-xs text-emerald-300">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-emerald-700/50 transition-colors w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
