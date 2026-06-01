import React from "react";
import { Bell, Plus, Search } from "lucide-react";
import { Link } from "react-router";
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

        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un client, un projet ou une adresse..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/projects"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouveau projet
          </Link>

          <button className="relative p-2.5 text-muted-foreground hover:text-secondary hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
