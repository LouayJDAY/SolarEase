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
  inverterId?: number;
  panelType?: "CLASSIC" | "NIGHT_PANEL";
  nightPanelId?: number;
  dailyConsumptionKwh?: number;
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
}

export interface FinancialMetrics {
  totalInvestmentCost: number;
  annualSavings: number;
  roiPercentage: number;
  paybackPeriodYears: number;
  netSavings25Years: number;
  cumulativeCashFlow: number[];
}

export interface DimensioningResponse {
  id: number;
  projectId: number;
  roof: any;
  installation: SolarInstallation;
  status: string;
  createdAt: string;
  aiRecommendation: string;
  panelType: string;
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
