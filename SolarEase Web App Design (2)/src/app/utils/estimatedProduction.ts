export interface MonthlyProductionPoint {
  month: string;
  production: number;
  target: number;
}

/** Profil saisonnier Tunisie (pic été, creux hiver) — somme normalisée à 1. */
const TUNISIA_SEASONAL = [
  0.058, // Jan
  0.065, // Fév
  0.078, // Mar
  0.088, // Avr
  0.098, // Mai
  0.108, // Jun
  0.118, // Jul
  0.112, // Aoû
  0.092, // Sep
  0.082, // Oct
  0.062, // Nov
  0.049, // Déc
];

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export function buildEstimatedMonthlyProduction(
  estimatedAnnualProductionKwh: number
): MonthlyProductionPoint[] {
  if (!estimatedAnnualProductionKwh || estimatedAnnualProductionKwh <= 0) {
    return [];
  }

  const monthlyTarget = Math.round(estimatedAnnualProductionKwh / 12);

  return MONTH_LABELS.map((month, i) => ({
    month,
    production: Math.round(estimatedAnnualProductionKwh * TUNISIA_SEASONAL[i]),
    target: monthlyTarget,
  }));
}

export function getLatestDimensioningAnnualKwh(
  dimensionings: { createdAt: string; installation?: { estimatedAnnualProductionKwh?: number } }[]
): number | null {
  if (!dimensionings.length) return null;

  const sorted = [...dimensionings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const annual = sorted[0]?.installation?.estimatedAnnualProductionKwh;
  return annual && annual > 0 ? annual : null;
}
