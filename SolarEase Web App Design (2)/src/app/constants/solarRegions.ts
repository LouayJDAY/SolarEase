/** Productivité solaire moyenne (kWh/kWc/an) par zone climatique — Tunisie. */
export type SolarRegionId = "Tunis" | "Nord" | "Centre" | "Sahel" | "Sud";

export type IrradianceLevel = "moderate" | "good" | "excellent";

export interface SolarRegion {
  id: SolarRegionId;
  label: string;
  governorates: string;
  productivityKwhPerKwp: number;
  irradiance: IrradianceLevel;
  /** Heures d'ensoleillement moyen / jour (ordre de grandeur). */
  sunHoursPerDay: number;
  hint: string;
}

export const SOLAR_REGIONS: SolarRegion[] = [
  {
    id: "Tunis",
    label: "Grand Tunis",
    governorates: "Tunis, Ariana, Ben Arous, Manouba",
    productivityKwhPerKwp: 1560,
    irradiance: "moderate",
    sunHoursPerDay: 6.2,
    hint: "Zone côtière urbaine — bon rendement, légèrement inférieur au Sahel.",
  },
  {
    id: "Nord",
    label: "Nord",
    governorates: "Bizerte, Béja, Jendouba, Le Kef, Siliana, Zaghouan",
    productivityKwhPerKwp: 1480,
    irradiance: "moderate",
    sunHoursPerDay: 5.8,
    hint: "Hivers plus humides — production légèrement plus basse qu'au centre.",
  },
  {
    id: "Centre",
    label: "Centre",
    governorates: "Kairouan, Kasserine, Sidi Bouzid",
    productivityKwhPerKwp: 1650,
    irradiance: "good",
    sunHoursPerDay: 6.6,
    hint: "Zone intérieure — bon ensoleillement toute l'année.",
  },
  {
    id: "Sahel",
    label: "Sahel",
    governorates: "Sousse, Monastir, Mahdia",
    productivityKwhPerKwp: 1720,
    irradiance: "excellent",
    sunHoursPerDay: 7.0,
    hint: "L'une des zones les plus ensoleillées du pays.",
  },
  {
    id: "Sud",
    label: "Sud",
    governorates: "Sfax, Gabès, Médenine, Tataouine, Tozeur, Gafsa",
    productivityKwhPerKwp: 1780,
    irradiance: "excellent",
    sunHoursPerDay: 7.4,
    hint: "Irradiation maximale — idéal pour maximiser la production.",
  },
];

export const IRRADIANCE_LABELS: Record<
  IrradianceLevel,
  { label: string; color: string; bg: string }
> = {
  moderate: { label: "Modéré", color: "text-amber-700", bg: "bg-amber-100" },
  good: { label: "Bon", color: "text-emerald-700", bg: "bg-emerald-100" },
  excellent: { label: "Excellent", color: "text-primary", bg: "bg-primary/10" },
};

export function getSolarRegion(id: string): SolarRegion | undefined {
  return SOLAR_REGIONS.find((r) => r.id === id);
}
