import { AlertTriangle, HardHat, ImageIcon } from "lucide-react";
import {
  FIELD_STATUS_COLORS,
  FIELD_STATUS_LABELS,
  type FieldUpdate,
  type InstallerFieldStatus,
} from "../../services/fieldUpdateService";

interface MonInstallationCardProps {
  progressPercent?: number | null;
  currentPhaseLabel?: string | null;
  latest?: FieldUpdate | null;
  recentPhotos: { url: string; date: string; caption?: string | null }[];
}

export function MonInstallationCard({
  progressPercent,
  currentPhaseLabel,
  latest,
  recentPhotos,
}: MonInstallationCardProps) {
  const status = latest?.fieldStatus as InstallerFieldStatus | undefined;
  const statusLabel = status ? FIELD_STATUS_LABELS[status] ?? status : null;
  const statusColor = status ? FIELD_STATUS_COLORS[status] : "bg-slate-100 text-slate-600";
  const safeProgress = Math.max(0, Math.min(100, progressPercent ?? 0));

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-white to-primary/5 p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Mon installation
          </p>
          <h2 className="text-lg font-bold text-secondary mt-0.5 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-primary" />
            {currentPhaseLabel ?? "Démarrage du chantier"}
          </h2>
        </div>
        {statusLabel && (
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusColor}`}
          >
            {statusLabel}
          </span>
        )}
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Avancement global</span>
          <span className="font-bold text-primary">{safeProgress}%</span>
        </div>
        <div className="h-3 bg-primary/10 rounded-full overflow-hidden">
          <div
            className="h-3 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      </div>

      {latest?.isBlockage && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-red-700">
              Chantier en pause
              {latest.blockageTypeLabel && ` — ${latest.blockageTypeLabel}`}
              {latest.blockageImpactLabel && ` (${latest.blockageImpactLabel})`}
            </p>
            <p className="text-red-600 mt-0.5">
              {latest.blockageReason ?? "Votre installateur reprendra dès que possible."}
            </p>
          </div>
        </div>
      )}

      {latest?.note && !latest.isBlockage && (
        <p className="text-sm text-slate-600 leading-relaxed">{latest.note}</p>
      )}

      {recentPhotos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            Photos récentes
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentPhotos.map((p, i) => (
              <a
                key={i}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0"
                title={
                  p.caption ??
                  new Date(p.date).toLocaleDateString("fr-TN", {
                    day: "numeric",
                    month: "short",
                  })
                }
              >
                <img
                  src={p.url}
                  alt="Photo terrain"
                  className="w-24 h-24 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition"
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MonInstallationCard;
