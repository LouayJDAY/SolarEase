export type InstallationPhaseKey =
  | "PREPARATION"
  | "STRUCTURE"
  | "PV"
  | "ELECTRIQUE"
  | "TESTS"
  | "ADMIN_STEG";

export interface InstallationPhase {
  key: InstallationPhaseKey;
  label: string;
  hint: string;
}

/**
 * Canonical order for the installer checklist. Backend computes
 * `progressPercent = completedSteps.length * 100 / 6`.
 */
export const INSTALLATION_PHASES: InstallationPhase[] = [
  { key: "PREPARATION", label: "Préparation",            hint: "Accès toit OK, matériel livré" },
  { key: "STRUCTURE",   label: "Structure",              hint: "Rails posés, ancrages vérifiés" },
  { key: "PV",          label: "Pose des panneaux",      hint: "Panneaux fixés, câblage DC" },
  { key: "ELECTRIQUE",  label: "Raccordement électrique", hint: "Onduleur, tableau, disjoncteurs" },
  { key: "TESTS",       label: "Tests et mise en service", hint: "Mesures, sécurité" },
  { key: "ADMIN_STEG",  label: "Dossier STEG",           hint: "Dossier déposé / approuvé" },
];

const PHASE_LABEL_BY_KEY: Record<InstallationPhaseKey, string> = INSTALLATION_PHASES.reduce(
  (acc, p) => ({ ...acc, [p.key]: p.label }),
  {} as Record<InstallationPhaseKey, string>
);

export function computeProgress(steps: string[] | null | undefined): number {
  if (!steps || steps.length === 0) return 0;
  const valid = steps.filter((s) => s in PHASE_LABEL_BY_KEY).length;
  return Math.min(100, Math.round((valid * 100) / INSTALLATION_PHASES.length));
}

export function phaseLabel(key?: string | null): string | null {
  if (!key) return null;
  return PHASE_LABEL_BY_KEY[key as InstallationPhaseKey] ?? null;
}

export function currentPhaseLabel(steps: string[] | null | undefined): string | null {
  if (!steps || steps.length === 0) return null;
  const set = new Set(steps);
  let last: InstallationPhase | null = null;
  for (const p of INSTALLATION_PHASES) {
    if (set.has(p.key)) last = p;
  }
  return last?.label ?? null;
}

export const BLOCKAGE_TYPES = [
  { key: "METEO",         label: "Météo" },
  { key: "ACCES_TOIT",    label: "Accès toit" },
  { key: "MATERIEL",      label: "Matériel manquant" },
  { key: "STEG",          label: "STEG" },
  { key: "CLIENT_ABSENT", label: "Client absent" },
  { key: "AUTRE",         label: "Autre" },
] as const;

export type BlockageTypeKey = typeof BLOCKAGE_TYPES[number]["key"];

export const BLOCKAGE_IMPACTS = [
  { key: "ONE_DAY",    label: "+1 jour" },
  { key: "THREE_DAYS", label: "+3 jours" },
  { key: "UNKNOWN",    label: "Indéterminé" },
] as const;

export type BlockageImpactKey = typeof BLOCKAGE_IMPACTS[number]["key"];
