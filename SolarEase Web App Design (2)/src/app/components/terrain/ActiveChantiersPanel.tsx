import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, ArrowRight, HardHat, Loader2 } from "lucide-react";
import projectService, { ProjectResponse } from "../../services/projectService";
import {
  FIELD_STATUS_COLORS,
  FIELD_STATUS_LABELS,
  type InstallerFieldStatus,
} from "../../services/fieldUpdateService";

interface ActiveChantiersPanelProps {
  /** Hide the row matching this id (typically the project being viewed). */
  excludeProjectId?: number;
}

/**
 * Cross-project quick view for admins: lists projects with an active
 * field-status, ordered by alert (blocages first), then by progress.
 */
export function ActiveChantiersPanel({ excludeProjectId }: ActiveChantiersPanelProps) {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    projectService
      .getAllProjects({ size: 50 })
      .then((page) => {
        if (cancelled) return;
        const active = page.content.filter(
          (p) => p.currentFieldStatus && p.currentFieldStatus !== "FIN_CHANTIER"
        );
        active.sort((a, b) => {
          const aBlock = a.currentFieldStatus === "BLOCAGE" ? 1 : 0;
          const bBlock = b.currentFieldStatus === "BLOCAGE" ? 1 : 0;
          if (aBlock !== bBlock) return bBlock - aBlock;
          return (b.currentProgress ?? 0) - (a.currentProgress ?? 0);
        });
        setProjects(active);
      })
      .catch(() => setProjects([]))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = projects.filter((p) => p.id !== excludeProjectId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-secondary flex items-center gap-2">
          <HardHat className="w-4 h-4 text-primary" />
          Autres chantiers actifs
        </h2>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {!loading && visible.length === 0 ? (
        <p className="text-xs text-slate-400">Aucun autre chantier actif.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.slice(0, 6).map((p) => {
            const status = p.currentFieldStatus as InstallerFieldStatus | undefined;
            const statusLabel = status ? FIELD_STATUS_LABELS[status] ?? status : "—";
            const statusColor = status
              ? FIELD_STATUS_COLORS[status]
              : "bg-slate-100 text-slate-600";
            const isBlock = status === "BLOCAGE";
            return (
              <li
                key={p.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                  <span className="text-sm text-slate-700 truncate">
                    {p.name}
                  </span>
                  {p.installerEmail && (
                    <span className="text-xs text-slate-400 truncate hidden sm:inline">
                      · {p.installerEmail}
                    </span>
                  )}
                  {isBlock && (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {p.currentProgress ?? 0}%
                  </span>
                  <Link
                    to={`/projects/${p.id}`}
                    className="text-slate-400 hover:text-primary"
                    aria-label="Ouvrir le projet"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ActiveChantiersPanel;
