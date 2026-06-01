import React from "react";
import {
  DemandStatus,
  DemandSource,
  DemandPriority,
  STATUS_LABELS,
  SOURCE_LABELS,
  PRIORITY_LABELS,
} from "../../services/demandService";

/**
 * The backend may temporarily return demands without the new {@link DemandSource}
 * or {@link DemandPriority} columns (e.g. old running container, legacy rows
 * created before V13). We treat missing values as safe defaults so the Inbox
 * doesn't crash the whole page.
 */
const STATUS_FALLBACK = { label: "Inconnue",  color: "text-slate-600", bg: "bg-slate-100", ring: "ring-slate-200" };
const SOURCE_FALLBACK = { label: "Source inconnue", short: "—",      color: "text-slate-600", bg: "bg-slate-100" };
const PRIORITY_FALLBACK = { label: "Normale", color: "text-slate-600", bg: "bg-slate-50" };

export function StatusBadge({
  status,
  size = "sm",
}: {
  status?: DemandStatus | null;
  size?: "xs" | "sm";
}) {
  const st = (status && STATUS_LABELS[status]) || STATUS_FALLBACK;
  const sizeCls = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeCls} ${st.color} ${st.bg}`}>
      {st.label}
    </span>
  );
}

export function SourceBadge({
  source,
  size = "sm",
}: {
  source?: DemandSource | null;
  size?: "xs" | "sm";
}) {
  const sc = (source && SOURCE_LABELS[source]) || SOURCE_FALLBACK;
  const sizeCls = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeCls} ${sc.color} ${sc.bg}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          source === "PUBLIC" ? "bg-purple-500" : "bg-slate-500"
        }`}
      />
      {sc.short}
    </span>
  );
}

export function PriorityBadge({
  priority,
  size = "sm",
}: {
  priority?: DemandPriority | null;
  size?: "xs" | "sm";
}) {
  // Hide the badge for the default "NORMALE" priority (or when unknown) to
  // keep the list visually quiet -- only HAUTE / BASSE deserve a chip.
  if (!priority || priority === "NORMALE") {
    return null;
  }
  const p = PRIORITY_LABELS[priority] || PRIORITY_FALLBACK;
  const sizeCls = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeCls} ${p.color} ${p.bg}`}>
      {priority === "HAUTE" ? "⚡" : "·"} {p.label}
    </span>
  );
}
