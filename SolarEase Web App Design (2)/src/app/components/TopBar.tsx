import React from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function TopBar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="h-16 bg-white/95 backdrop-blur border-b border-slate-200 fixed top-0 right-0 left-64 z-10 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <div className="hidden xl:block">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {isAdmin ? "Interface administrateur" : "Interface installateur"}
          </p>
          <p className="text-sm font-medium text-secondary">
            {isAdmin ? "Gestion globale de la plateforme" : "Pilotage des projets et des clients"}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button className="relative p-2.5 text-muted-foreground hover:text-secondary hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
