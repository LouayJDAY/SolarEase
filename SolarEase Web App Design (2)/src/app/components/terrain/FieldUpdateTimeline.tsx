import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardHat,
  ImageIcon,
  XCircle,
} from "lucide-react";
import { AuthenticatedImage } from "../AuthenticatedImage";
import {
  FIELD_STATUS_COLORS,
  FIELD_STATUS_LABELS,
  type FieldUpdate,
  type InstallerFieldStatus,
} from "../../services/fieldUpdateService";

interface FieldUpdateTimelineProps {
  updates: FieldUpdate[];
  isAdmin: boolean;
  validatingId: number | null;
  onValidate: (update: FieldUpdate, decision: boolean) => void;
}

function formatDuration(from: Date, to: Date): string | null {
  const diffMs = Math.max(0, to.getTime() - from.getTime());
  if (diffMs < 60_000) return null;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} j`;
}

export function FieldUpdateTimeline({
  updates,
  isAdmin,
  validatingId,
  onValidate,
}: FieldUpdateTimelineProps) {
  if (updates.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <HardHat className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Aucune mise à jour terrain pour ce projet</p>
      </div>
    );
  }

  // updates are returned newest first by the backend
  return (
    <ol className="relative pl-6">
      <span
        className="absolute left-2 top-2 bottom-2 w-px bg-slate-200"
        aria-hidden="true"
      />
      {updates.map((update, idx) => {
        const previous = updates[idx + 1]; // older entry (list is desc)
        const duration = previous
          ? formatDuration(new Date(previous.createdAt), new Date(update.createdAt))
          : null;

        const status = update.fieldStatus as InstallerFieldStatus;
        const statusColor =
          FIELD_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600";
        const statusLabel = FIELD_STATUS_LABELS[status] ?? status;

        const isPending =
          update.requiresAdminValidation && update.adminValidated === null;
        const isValidated = update.adminValidated === true;
        const isRejected = update.adminValidated === false;

        return (
          <li key={update.id} className="relative pb-6 last:pb-0">
            <span
              className={`absolute -left-[1.05rem] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                update.isBlockage
                  ? "bg-red-500 ring-red-200"
                  : "bg-primary ring-primary/30"
              }`}
              aria-hidden="true"
            />

            <div
              className={`rounded-xl border p-4 space-y-3 ${
                update.isBlockage
                  ? "border-red-200 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                  {update.currentPhaseLabel && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {update.currentPhaseLabel}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(update.createdAt).toLocaleString("fr-FR")}
                  </span>
                  {duration && (
                    <span className="text-[11px] text-slate-400">
                      · +{duration}
                    </span>
                  )}
                  {update.installerEmail && (
                    <span className="text-xs text-slate-400">
                      — {update.installerEmail}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {update.requiresAdminValidation && (
                    <>
                      {isPending && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" /> En attente
                        </span>
                      )}
                      {isValidated && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Validé
                        </span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" /> Rejeté
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Avancement</span>
                  <span className="font-semibold text-primary">
                    {update.progressPercent}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-primary rounded-full transition-all"
                    style={{ width: `${update.progressPercent}%` }}
                  />
                </div>
              </div>

              {update.note && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {update.note}
                </p>
              )}

              {update.photoUrl && (
                <div className="inline-flex items-center gap-2 group">
                  <AuthenticatedImage
                    src={update.photoUrl}
                    alt="Photo terrain"
                    enlargeOnClick
                    className="w-24 h-24 object-cover rounded-lg border border-slate-200 group-hover:opacity-90 transition"
                  />
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 group-hover:text-primary">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Photo terrain — cliquer pour agrandir
                  </span>
                </div>
              )}

              {update.isBlockage && (
                <div className="flex items-start gap-2 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-red-700">
                      Blocage signalé
                      {update.blockageTypeLabel && ` — ${update.blockageTypeLabel}`}
                      {update.blockageImpactLabel && ` (${update.blockageImpactLabel})`}
                    </p>
                    {update.blockageReason && (
                      <p className="text-red-600 mt-0.5">{update.blockageReason}</p>
                    )}
                  </div>
                </div>
              )}

              {update.adminNote && (
                <div className="text-xs text-slate-500 italic border-t border-slate-100 pt-2">
                  Note admin: {update.adminNote}
                  {update.validatedByAdminEmail && (
                    <span className="ml-2">— {update.validatedByAdminEmail}</span>
                  )}
                </div>
              )}

              {isAdmin && isPending && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onValidate(update, true)}
                    disabled={validatingId === update.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valider
                  </button>
                  <button
                    onClick={() => onValidate(update, false)}
                    disabled={validatingId === update.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default FieldUpdateTimeline;
