import React from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Phone, MapPin, Inbox } from "lucide-react";
import { Demand } from "../../services/demandService";
import { StatusBadge, SourceBadge, PriorityBadge } from "./RequestStatusBadge";

interface Props {
  demands: Demand[];
  selectedId: number | null;
  loading: boolean;
  /** Set of demand ids the user has not yet opened in this session (live arrivals). */
  unseenIds: Set<number>;
  onSelect: (demand: Demand) => void;
}

export function RequestList({ demands, selectedId, loading, unseenIds, onSelect }: Props) {
  if (loading && demands.length === 0) {
    return (
      <div className="p-4 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (demands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Inbox className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-secondary mb-1">Aucune demande</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Aucune demande ne correspond à vos filtres. Réinitialisez la recherche pour voir l'ensemble.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {demands.map((d) => {
        const active = d.id === selectedId;
        const unseen = unseenIds.has(d.id);
        const clientName =
          `${d.clientFirstName ?? ""} ${d.clientLastName ?? ""}`.trim() || d.clientEmail || "Prospect";
        const timeAgo = (() => {
          try {
            return formatDistanceToNow(new Date(d.createdAt), { locale: fr, addSuffix: true });
          } catch {
            return "";
          }
        })();

        return (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onSelect(d)}
              className={`w-full text-left px-4 py-3 flex flex-col gap-2 transition-colors ${
                active
                  ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
                  : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-2">
                {unseen && (
                  <span
                    className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"
                    aria-label="Nouvelle demande non consultée"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-secondary truncate">
                      {clientName}
                    </span>
                    <SourceBadge source={d.source} size="xs" />
                    <PriorityBadge priority={d.priority} size="xs" />
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-1 mt-0.5">{d.name}</p>
                </div>
                <StatusBadge status={d.status} size="xs" />
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pl-0">
                {d.clientEmail && (
                  <span className="inline-flex items-center gap-1 truncate max-w-[12rem]">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{d.clientEmail}</span>
                  </span>
                )}
                {d.clientPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {d.clientPhone}
                  </span>
                )}
                {d.location && (
                  <span className="inline-flex items-center gap-1 truncate max-w-[8rem]">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{d.location}</span>
                  </span>
                )}
                <span className="ml-auto shrink-0">{timeAgo}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
