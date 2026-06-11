import { z } from "zod";
import { inclinationSchema, latitudeSchema, longitudeSchema, positiveNumberSchema } from "./common";

export const dimensioningBaseSchema = z.object({
  area: positiveNumberSchema,
  inclination: inclinationSchema,
  orientation: z.string().min(1, "L'orientation est requise."),
  roofType: z.string().min(1, "Le type de toit est requis."),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  panelId: z.string().optional(),
  inverterId: z.string().optional(),
  nightPanelId: z.string().optional(),
  dailyConsumptionKwh: z.string().optional(),
  quarterlyBillTnd: z.string().optional(),
});

export type DimensioningFormValues = z.infer<typeof dimensioningBaseSchema>;

export function validateDimensioningConsumption(
  mode: "CLASSIC" | "NIGHT_PANEL" | "COMPARE",
  consumptionInputMode: "daily" | "quarterly",
  dailyConsumptionKwh: string,
  quarterlyBillTnd: string
): string | null {
  if (mode === "CLASSIC") return null;

  const daily = parseFloat(dailyConsumptionKwh);
  const quarterly = parseFloat(quarterlyBillTnd);
  const hasDaily = !Number.isNaN(daily) && daily > 0;
  const hasQuarterly = !Number.isNaN(quarterly) && quarterly > 0;

  if (consumptionInputMode === "daily" && dailyConsumptionKwh.trim() !== "" && !hasDaily) {
    return "La consommation journalière doit être un nombre positif (kWh/jour).";
  }
  if (consumptionInputMode === "quarterly" && quarterlyBillTnd.trim() !== "" && !hasQuarterly) {
    return "Le montant de la facture trimestrielle doit être un nombre positif (TND).";
  }
  if (!hasDaily && !hasQuarterly) {
    return "Indiquez la consommation client (kWh/jour ou facture trimestrielle) pour le mode Night Panel.";
  }
  return null;
}

export function validateDimensioningPanelSelection(
  _mode: "CLASSIC" | "NIGHT_PANEL" | "COMPARE",
  _panelId: string,
  _nightPanelId: string
): string | null {
  // « Auto-sélection » (valeur vide) : le backend résout le panneau par défaut
  return null;
}
