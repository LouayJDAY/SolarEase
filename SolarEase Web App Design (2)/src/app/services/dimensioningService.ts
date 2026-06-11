import api from "./api";

export interface DimensioningRequest {
  projectId: number;
  area: number;
  inclination: number;
  orientation: string; // "SOUTH", "NORTH", etc.
  roofType: string; // "FLAT", "PITCHED_TILES", etc.
  latitude: number;
  longitude: number;
  panelId?: number;
  nightPanelId?: number;
  inverterId?: number;
  panelType?: "CLASSIC" | "NIGHT_PANEL";
  dailyConsumptionKwh?: number;
  quarterlyBillTnd?: number;
}

export interface SolarInstallation {
  id: number;
  panelCount: number;
  panelModel: string;
  totalCapacityKw: number;
  estimatedCost: number;
  estimatedAnnualProductionKwh: number;
  inverterModel: string;
  monthlySavings: number;
  co2Savings: number;
  isNightPanel?: boolean;
  storageCapacityKwh?: number;
  selfConsumptionRate?: number;
  nightCoverageRate?: number;
  dailyProductionKwh?: number;
  nightlyConsumptionKwh?: number;
  sizingConstraint?: "ROOF" | "CONSUMPTION" | "BOTH_EQUAL" | string;
  dailyConsumptionUsed?: number;
}

export interface FinancialMetrics {
  totalInvestmentCost: number;
  annualSavings: number;
  roiPercentage: number;
  paybackPeriodYears: number;
  netSavings25Years: number;
  cumulativeCashFlow: number[];
}

export interface KitInverter {
  equipmentId?: number;
  brand: string;
  model: string;
  powerKw: number;
  phase?: string;
  price?: number;
}

export interface KitCable {
  sectionMm2: number;
  brand?: string;
  standard?: string;
  application?: string;
}

export interface KitBreaker {
  equipmentId?: number;
  brand: string;
  reference: string;
  ratingA: number;
  application?: string;
  price?: number;
}

export interface RecommendedKit {
  inverter?: KitInverter;
  dcCable?: KitCable;
  acCable?: KitCable;
  dcBreaker?: KitBreaker;
  acBreaker?: KitBreaker;
  totalKitPrice?: number;
}

export interface InstallerRecommendation {
  verdict: "OK" | "ATTENTION" | "NON_COMPATIBLE" | string;
  compatibilityScore: number;
  recommendedKit?: RecommendedKit;
  alternatives?: KitInverter[];
  alerts?: string[];
  clientArguments?: string[];
  terrainChecklist?: string[];
  ragSources?: string[];
  narrativeSummary?: string;
  fallback?: boolean;
}

export interface EquipmentSummary {
  id: number;
  name: string;
  brand: string;
  model: string;
  equipmentType: string;
  panelCategory?: string;
  nominalPower: number;
  price?: number;
}

export interface DimensioningResponse {
  id: number;
  projectId: number;
  roof: any;
  installation: SolarInstallation;
  status: string;
  createdAt: string;
  aiRecommendation: string;
  installerRecommendation?: InstallerRecommendation;
  panelType: string;
  panel?: EquipmentSummary;
  inverter?: EquipmentSummary;
  financials: FinancialMetrics;
}

export interface HourlyData {
  hour: number;
  production: number;
  consumption: number;
  stored: number;
  fromStorage: number;
}

export interface ComparisonResponse {
  classic: DimensioningResponse;
  nightPanel: DimensioningResponse;
  productionDifferenceKwh: number;
  costDifferenceTnd: number;
  selfConsumptionGainPercent: number;
  paybackDifferenceYears: number;
  roiDifferencePercent: number;
  co2SavingsDifferenceKg: number;
  classicHourlyCurve: HourlyData[];
  nightPanelHourlyCurve: HourlyData[];
}

const dimensioningService = {
  calculate: (data: DimensioningRequest) =>
    api
      .post<DimensioningResponse>("/dimensioning/calculate", data)
      .then((r) => r.data),

  compare: (data: DimensioningRequest) =>
    api
      .post<ComparisonResponse>("/dimensioning/compare", data)
      .then((r) => r.data),

  getByProject: (projectId: number) =>
    api
      .get<DimensioningResponse[]>(`/dimensioning/project/${projectId}`)
      .then((r) => r.data),

  regenerateRecommendation: (dimensioningId: number) =>
    api
      .post<DimensioningResponse>(
        `/dimensioning/${dimensioningId}/ai/regenerate`,
        {},
        { timeout: 120_000 }
      )
      .then((r) => r.data),

  downloadPdf: (dimensioningId: number) =>
    api
      .get(`/dimensioning/${dimensioningId}/pdf`, { responseType: "blob" })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `rapport-dimensionnement-${dimensioningId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }),
};

export default dimensioningService;
