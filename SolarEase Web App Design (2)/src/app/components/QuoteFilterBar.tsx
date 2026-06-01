import React from "react";
import { Search, Filter, X } from "lucide-react";
import type { QuoteStatus } from "../services/quoteService";

export type QuoteStatusFilter = "ALL" | QuoteStatus;

interface InstallerOption {
  id: string;
  label: string;
}

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: QuoteStatusFilter;
  onStatusFilterChange: (value: QuoteStatusFilter) => void;
  installerFilter?: string;
  onInstallerFilterChange?: (value: string) => void;
  installerOptions?: InstallerOption[];
  showInstallerFilter?: boolean;
  showCounts?: Partial<Record<QuoteStatusFilter, number>>;
}

const statusChips: Array<{ id: QuoteStatusFilter; label: string; activeClass: string }> = [
  { id: "ALL", label: "Tous", activeClass: "bg-secondary text-white border-secondary" },
  { id: "DRAFT", label: "Brouillon", activeClass: "bg-gray-700 text-white border-gray-700" },
  { id: "SENT", label: "Envoye", activeClass: "bg-blue-600 text-white border-blue-600" },
  { id: "ACCEPTED", label: "Accepte", activeClass: "bg-emerald-600 text-white border-emerald-600" },
  { id: "INVOICED", label: "Facture", activeClass: "bg-purple-600 text-white border-purple-600" },
  { id: "REJECTED", label: "Refuse", activeClass: "bg-rose-600 text-white border-rose-600" },
  { id: "EXPIRED", label: "Expire", activeClass: "bg-orange-600 text-white border-orange-600" },
];

export function QuoteFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  installerFilter,
  onInstallerFilterChange,
  installerOptions,
  showInstallerFilter,
  showCounts,
}: Props) {
  const hasActiveFilters = statusFilter !== "ALL" || (installerFilter && installerFilter !== "ALL") || search.length > 0;

  const handleReset = () => {
    onSearchChange("");
    onStatusFilterChange("ALL");
    if (onInstallerFilterChange) onInstallerFilterChange("ALL");
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher par numero de devis, projet ou client..."
            className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {showInstallerFilter && installerOptions && onInstallerFilterChange && (
          <div className="relative md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={installerFilter ?? "ALL"}
              onChange={(e) => onInstallerFilterChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
            >
              <option value="ALL">Tous les installateurs</option>
              {installerOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Reinitialiser
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusChips.map((chip) => {
          const active = statusFilter === chip.id;
          const count = showCounts?.[chip.id];
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onStatusFilterChange(chip.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? chip.activeClass
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {chip.label}
              {typeof count === "number" && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold ${
                    active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
