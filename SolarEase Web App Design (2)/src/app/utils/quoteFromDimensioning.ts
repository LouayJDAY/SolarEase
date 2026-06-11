import type { DimensioningResponse } from "../services/dimensioningService";
import type { QuoteCreateRequest } from "../services/quoteService";

export const TVA_RATE = 0.19;
const LABOR_RATE = 0.15;

export function computeTva(htAmount: number): number {
  return Math.round(htAmount * TVA_RATE * 100) / 100;
}

export interface QuotePrefillResult {
  form: Pick<
    QuoteCreateRequest,
    "description" | "laborCost" | "materialsCost" | "tax" | "notes"
  >;
  dimensioningId: number;
  dimensioningDate: string;
}

export function getLatestDimensioning(
  dimensionings: DimensioningResponse[]
): DimensioningResponse | null {
  if (!dimensionings.length) return null;
  return [...dimensionings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

function panelTypeLabel(panelType?: string): string {
  if (panelType === "NIGHT_PANEL") return "Night Panel";
  if (panelType === "CLASSIC") return "Classique";
  return panelType ?? "—";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildQuotePrefillFromDimensioning(
  dim: DimensioningResponse
): QuotePrefillResult {
  const inst = dim.installation;
  const panelCount = inst?.panelCount ?? 0;
  const panelPrice = dim.panel?.price ?? 450;
  const inverterPrice = dim.inverter?.price ?? 2500;
  const kitPrice = dim.installerRecommendation?.recommendedKit?.totalKitPrice ?? 0;

  let materialsCost = panelCount * panelPrice + inverterPrice + kitPrice;

  const total =
    dim.financials?.totalInvestmentCost ??
    inst?.estimatedCost ??
    materialsCost * (1 + LABOR_RATE);

  if (materialsCost <= 0 && total > 0) {
    materialsCost = round2(total / (1 + LABOR_RATE));
  } else if (materialsCost > total) {
    materialsCost = round2(total / (1 + LABOR_RATE));
  }

  const laborCost = round2(Math.max(0, total - materialsCost));
  const tax = computeTva(materialsCost + laborCost);

  const capacity = inst?.totalCapacityKw
    ? `${inst.totalCapacityKw.toFixed(2)} kWc`
    : "—";
  const production = inst?.estimatedAnnualProductionKwh
    ? `${Math.round(inst.estimatedAnnualProductionKwh).toLocaleString("fr-TN")} kWh/an`
    : "—";
  const panelModel =
    dim.panel?.model ?? inst?.panelModel ?? "—";
  const inverterModel =
    dim.inverter?.model ?? inst?.inverterModel ?? "—";

  const description = [
    `Installation photovoltaique ${panelTypeLabel(dim.panelType)} — ${capacity}`,
    `${panelCount} panneau(x) ${panelModel}`,
    `Onduleur : ${inverterModel}`,
    `Production estimée : ${production}`,
  ].join("\n");

  const roi = dim.financials?.roiPercentage;
  const payback = dim.financials?.paybackPeriodYears;
  const noteParts = [
    `Pré-rempli depuis le dimensionnement #${dim.id} (${new Date(dim.createdAt).toLocaleDateString("fr-TN")}).`,
  ];
  if (roi != null) noteParts.push(`ROI estimé : ${Math.round(roi)} %.`);
  if (payback != null) noteParts.push(`Amortissement : ${payback.toFixed(1)} ans.`);

  return {
    form: {
      description,
      materialsCost: round2(materialsCost),
      laborCost,
      tax,
      notes: noteParts.join(" "),
    },
    dimensioningId: dim.id,
    dimensioningDate: dim.createdAt,
  };
}
