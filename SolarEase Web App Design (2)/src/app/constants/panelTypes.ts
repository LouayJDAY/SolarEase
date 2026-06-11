/** Modes de dimensionnement (Classique / Night Panel / Comparer). */
export type DimensioningMode = "CLASSIC" | "NIGHT_PANEL" | "COMPARE";

export interface DimensioningModeOption {
  code: DimensioningMode;
  label: string;
  description: string;
  accent: string;
  accentBg: string;
}

export const DIMENSIONING_MODE_OPTIONS: DimensioningModeOption[] = [
  {
    code: "CLASSIC",
    label: "Classique",
    description: "Panneaux solaires du catalogue (TOPCon, bifacial, biverre)",
    accent: "#4CAF50",
    accentBg: "bg-green-50",
  },
  {
    code: "NIGHT_PANEL",
    label: "Night Panel",
    description: "Panneaux avec stockage intégré pour autoconsommation nocturne",
    accent: "#6366F1",
    accentBg: "bg-indigo-50",
  },
  {
    code: "COMPARE",
    label: "Comparer",
    description: "Classique vs Night Panel côte à côte",
    accent: "#0D9488",
    accentBg: "bg-teal-50",
  },
];

/** Catégories catalogue pour les panneaux SOLAR_PANEL. */
export type PanelCategoryCode = "TOPCON_N_TYPE" | "BIFACIAL" | "GLASS_GLASS";

export interface PanelCategoryOption {
  code: PanelCategoryCode;
  label: string;
  description: string;
}

export const PANEL_CATEGORY_OPTIONS: PanelCategoryOption[] = [
  {
    code: "TOPCON_N_TYPE",
    label: "Monocristallin TOPCon / N-type",
    description: "Cellules N-type, rendement élevé",
  },
  {
    code: "BIFACIAL",
    label: "Bifacial",
    description: "Gain arrière sur surface réfléchissante (+10%)",
  },
  {
    code: "GLASS_GLASS",
    label: "Biverre (glass-glass)",
    description: "Double verre trempé, longue durée de vie",
  },
];

export const PANEL_TYPE_LABELS: Record<string, string> = {
  CLASSIC: "Classique",
  NIGHT_PANEL: "Night Panel",
  TOPCON_N_TYPE: "Monocristallin TOPCon / N-type",
  BIFACIAL: "Bifacial",
  GLASS_GLASS: "Biverre (glass-glass)",
};

export function getPanelTypeLabel(code?: string | null): string {
  if (!code) return PANEL_TYPE_LABELS.CLASSIC;
  return PANEL_TYPE_LABELS[code] || code;
}

export function getPanelCategoryLabel(code?: string | null): string {
  if (!code) return PANEL_TYPE_LABELS.TOPCON_N_TYPE;
  return PANEL_TYPE_LABELS[code] || code;
}
