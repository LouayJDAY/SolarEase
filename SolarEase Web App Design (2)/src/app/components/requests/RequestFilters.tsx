import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { DemandSource, DemandStatus } from "../../services/demandService";

export interface RequestFiltersValue {
  status: DemandStatus | "ALL";
  source: DemandSource | "ALL";
  q: string;
}

interface Props {
  value: RequestFiltersValue;
  counts: { ALL: number; NOUVELLE: number; A_COMPLETER: number; VALIDEE: number; REJETEE: number };
  onChange: (next: RequestFiltersValue) => void;
}

const STATUS_TABS: { key: RequestFiltersValue["status"]; label: string }[] = [
  { key: "ALL",         label: "Toutes" },
  { key: "NOUVELLE",    label: "Nouvelles" },
  { key: "A_COMPLETER", label: "À compléter" },
  { key: "VALIDEE",     label: "Validées" },
  { key: "REJETEE",     label: "Rejetées" },
];

const SOURCE_OPTIONS: { key: RequestFiltersValue["source"]; label: string }[] = [
  { key: "ALL",    label: "Tous" },
  { key: "PUBLIC", label: "Public" },
  { key: "CLIENT", label: "Portail" },
];

export function RequestFilters({ value, counts, onChange }: Props) {
  // Local input state for debounce
  const [searchInput, setSearchInput] = useState(value.q);

  useEffect(() => {
    setSearchInput(value.q);
  }, [value.q]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchInput !== value.q) {
        onChange({ ...value, q: searchInput });
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher par nom, email, téléphone, description... (raccourci: /)"
          id="requests-search-input"
          className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-100"
            aria-label="Effacer la recherche"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const active = value.status === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange({ ...value, status: tab.key })}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-secondary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  active ? "bg-white/20" : "bg-white text-slate-500"
                }`}
              >
                {count ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Source pill segment */}
      <div className="inline-flex items-center bg-slate-100 rounded-full p-1 self-start lg:self-auto">
        {SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange({ ...value, source: opt.key })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              value.source === opt.key
                ? "bg-white text-secondary shadow-sm"
                : "text-slate-600 hover:text-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
