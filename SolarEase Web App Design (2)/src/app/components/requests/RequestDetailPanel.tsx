import React from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Zap,
  Ruler,
  Sun,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FolderKanban,
  UserCheck,
  Inbox,
  ExternalLink,
  Clock,
  StickyNote,
} from "lucide-react";
import { Demand, DemandPriority } from "../../services/demandService";
import { StatusBadge, SourceBadge } from "./RequestStatusBadge";

interface Props {
  demand: Demand | null;
  /** When false, the action bar shows disabled buttons + a hint. */
  canAct: boolean;
  busyAction: "validate" | "complete" | "reject" | "assign" | null;
  onConvert: () => void;
  onAskCompletion: () => void;
  onReject: () => void;
  onAssignToMe: () => void;
  onChangePriority: (priority: DemandPriority) => void;
}

const PRIORITY_OPTIONS: DemandPriority[] = ["HAUTE", "NORMALE", "BASSE"];

export function RequestDetailPanel({
  demand,
  canAct,
  busyAction,
  onConvert,
  onAskCompletion,
  onReject,
  onAssignToMe,
  onChangePriority,
}: Props) {
  if (!demand) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-8 py-24 text-muted-foreground">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-secondary mb-1">Sélectionnez une demande</h3>
        <p className="text-xs max-w-xs">
          Choisissez une demande dans la liste pour afficher son détail, agir dessus ou la convertir en projet.
        </p>
      </div>
    );
  }

  const clientName =
    `${demand.clientFirstName ?? ""} ${demand.clientLastName ?? ""}`.trim() || demand.clientEmail || "Prospect";
  const createdAt = (() => {
    try {
      return format(new Date(demand.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return demand.createdAt;
    }
  })();
  const mapEmbed =
    demand.latitude != null && demand.longitude != null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${demand.longitude - 0.01}%2C${demand.latitude - 0.01}%2C${demand.longitude + 0.01}%2C${demand.latitude + 0.01}&layer=mapnik&marker=${demand.latitude}%2C${demand.longitude}`
      : null;

  const isLocked = demand.status === "VALIDEE" || demand.status === "REJETEE";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Demande #{demand.id}
            </p>
            <h2 className="text-xl font-semibold text-secondary truncate">{demand.name}</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={demand.status} />
            <SourceBadge source={demand.source} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {createdAt}
          </span>
          {demand.projectId && (
            <Link
              to={`/projects/${demand.projectId}`}
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Projet #{demand.projectId}
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Priority + Assign */}
        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Priorité :</span>
            <div className="inline-flex items-center bg-slate-100 rounded-full p-1">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={!canAct || busyAction === "assign" || isLocked}
                  onClick={() => onChangePriority(p)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors disabled:opacity-50 ${
                    demand.priority === p
                      ? "bg-white text-secondary shadow-sm"
                      : "text-slate-600 hover:text-secondary"
                  }`}
                >
                  {p === "HAUTE" ? "Haute" : p === "NORMALE" ? "Normale" : "Basse"}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onAssignToMe}
            disabled={!canAct || busyAction === "assign" || isLocked}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            {demand.assignedAdminId ? "M'assigner" : "M'assigner"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Client */}
        <Section title="Client" icon={<UserCheck className="w-4 h-4 text-primary" />}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Nom complet" value={clientName} />
            <Field
              label="Email"
              value={
                demand.clientEmail ? (
                  <a className="text-primary hover:underline inline-flex items-center gap-1" href={`mailto:${demand.clientEmail}`}>
                    <Mail className="w-3 h-3" /> {demand.clientEmail}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Téléphone"
              value={
                demand.clientPhone ? (
                  <a className="text-primary hover:underline inline-flex items-center gap-1" href={`tel:${demand.clientPhone}`}>
                    <Phone className="w-3 h-3" /> {demand.clientPhone}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Source"
              value={demand.source === "PUBLIC" ? "Formulaire public" : "Portail client"}
            />
          </div>
        </Section>

        {/* Project details */}
        <Section title="Projet demandé" icon={<Sun className="w-4 h-4 text-primary" />}>
          {demand.description && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-700 whitespace-pre-line">{demand.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Localisation" value={demand.location || "—"} icon={<MapPin className="w-3 h-3" />} />
            <Field label="Puissance" value={demand.peakPower != null ? `${demand.peakPower} kWc` : "—"} icon={<Zap className="w-3 h-3" />} />
            <Field label="Surface" value={demand.availableArea != null ? `${demand.availableArea} m²` : "—"} icon={<Ruler className="w-3 h-3" />} />
            <Field label="Inclinaison / Orientation" value={
              demand.inclination != null || demand.orientation != null
                ? `${demand.inclination ?? "—"}° / ${demand.orientation ?? "—"}°`
                : "—"
            } />
            <Field label="Budget" value={demand.budget != null ? `${demand.budget.toLocaleString("fr-FR")} TND` : "—"} icon={<DollarSign className="w-3 h-3" />} />
            <Field label="Coordonnées" value={
              demand.latitude != null && demand.longitude != null
                ? `${demand.latitude.toFixed(4)}, ${demand.longitude.toFixed(4)}`
                : "—"
            } />
          </div>

          {mapEmbed && (
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-200">
              <iframe
                title="Localisation de la demande"
                src={mapEmbed}
                className="w-full h-48"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </Section>

        {/* Admin notes / rejection */}
        {(demand.adminNote || demand.rejectionReason) && (
          <Section title="Notes admin" icon={<StickyNote className="w-4 h-4 text-primary" />}>
            {demand.adminNote && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-800">
                <p className="font-medium text-xs uppercase tracking-wider mb-1">Note</p>
                <p className="whitespace-pre-line">{demand.adminNote}</p>
              </div>
            )}
            {demand.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                <p className="font-medium text-xs uppercase tracking-wider mb-1">Motif de rejet</p>
                <p className="whitespace-pre-line">{demand.rejectionReason}</p>
              </div>
            )}
          </Section>
        )}

        {/* Timeline */}
        <Section title="Historique" icon={<Clock className="w-4 h-4 text-primary" />}>
          <ol className="relative border-l border-slate-200 ml-2 space-y-3">
            <li className="ml-4">
              <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-white" />
              <p className="text-xs font-medium text-secondary">Demande soumise</p>
              <p className="text-[11px] text-muted-foreground">{createdAt}</p>
            </li>
            {demand.status === "A_COMPLETER" && (
              <li className="ml-4">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-orange-500 ring-2 ring-white" />
                <p className="text-xs font-medium text-secondary">Complément demandé</p>
              </li>
            )}
            {demand.status === "VALIDEE" && (
              <li className="ml-4">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />
                <p className="text-xs font-medium text-secondary">
                  Demande validée
                  {demand.projectId && ` — projet #${demand.projectId} créé`}
                </p>
              </li>
            )}
            {demand.status === "REJETEE" && (
              <li className="ml-4">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white" />
                <p className="text-xs font-medium text-secondary">Demande rejetée</p>
              </li>
            )}
          </ol>
        </Section>
      </div>

      {/* Action bar */}
      <div className="border-t border-slate-200 px-6 py-4 bg-white sticky bottom-0">
        {!canAct ? (
          <p className="text-xs text-muted-foreground text-center">
            Lecture seule — vous devez être administrateur pour agir sur les demandes.
          </p>
        ) : isLocked ? (
          <p className="text-xs text-muted-foreground text-center">
            Cette demande est {demand.status === "VALIDEE" ? "validée" : "rejetée"} — aucune action supplémentaire requise.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onConvert}
              disabled={!!busyAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              title="Raccourci : V"
            >
              <CheckCircle2 className="w-4 h-4" />
              Convertir en projet
            </button>
            <button
              type="button"
              onClick={onAskCompletion}
              disabled={!!busyAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 text-sm font-semibold hover:bg-orange-100 transition-colors disabled:opacity-60"
              title="Raccourci : C"
            >
              <AlertCircle className="w-4 h-4" />
              Demander complément
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={!!busyAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
              title="Raccourci : R"
            >
              <XCircle className="w-4 h-4" />
              Rejeter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-secondary font-medium inline-flex items-center gap-1">
        {icon}
        {value}
      </p>
    </div>
  );
}
