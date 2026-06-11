import type {
  EquipmentRequest,
  EquipmentResponse,
  EquipmentTypeCode,
  PanelCategoryCode,
} from "../services/equipmentService";

const TYPE_OPTIONS: {
  label: string;
  value: EquipmentTypeCode;
  category?: PanelCategoryCode;
}[] = [
  { label: "Panneau TOPCon N-type", value: "SOLAR_PANEL", category: "TOPCON_N_TYPE" },
  { label: "Panneau Bifacial", value: "SOLAR_PANEL", category: "BIFACIAL" },
  { label: "Panneau Biverre", value: "SOLAR_PANEL", category: "GLASS_GLASS" },
  { label: "Night Panel", value: "NIGHT_PANEL" },
  { label: "Onduleur", value: "INVERTER" },
  { label: "Batterie", value: "BATTERY" },
  { label: "Structure de Montage", value: "MOUNTING_SYSTEM" },
  { label: "Câble", value: "CABLE" },
];

export { TYPE_OPTIONS };

export function parsePower(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().toLowerCase().replace(/\s/g, "");
  const match = normalized.match(/^([\d.,]+)(kw|kwh|w)?$/);
  if (!match) return undefined;
  const num = parseFloat(match[1].replace(",", "."));
  if (Number.isNaN(num)) return undefined;
  const unit = match[2];
  if (unit === "kw" || unit === "kwh") return num * 1000;
  return num;
}

export function parseEfficiency(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().replace(",", ".").replace("%", "");
  const num = parseFloat(normalized);
  if (Number.isNaN(num)) return undefined;
  return num > 1 ? num / 100 : num;
}

export function typeLabelFromEquipment(e: EquipmentResponse): string {
  if (e.type === "SOLAR_PANEL" && e.panelCategory) {
    return (
      TYPE_OPTIONS.find(
        (t) => t.value === "SOLAR_PANEL" && t.category === e.panelCategory
      )?.label ?? ""
    );
  }
  return TYPE_OPTIONS.find((t) => t.value === e.type && !t.category)?.label ?? "";
}

export function buildEquipmentPayload(input: {
  name: string;
  typeLabel: string;
  brand: string;
  description: string;
  power: string;
  efficiency: string;
  price: string;
  warranty: string;
  imageUrl?: string;
}): EquipmentRequest {
  const selected = TYPE_OPTIONS.find((t) => t.label === input.typeLabel);
  const nominalPower = parsePower(input.power);
  const efficiency = parseEfficiency(input.efficiency);
  const price = parseFloat(input.price.replace(",", "."));
  const warrantyYears = input.warranty.trim()
    ? parseInt(input.warranty, 10)
    : undefined;

  if (!input.price.trim() || Number.isNaN(price) || price <= 0) {
    throw new Error("Le prix unitaire doit être supérieur à 0 TND.");
  }

  return {
    name: input.name.trim(),
    brand: input.brand.trim(),
    type: selected?.value ?? "SOLAR_PANEL",
    panelCategory: selected?.category,
    nominalPower,
    efficiency,
    price,
    warrantyYears,
    specifications: input.description.trim() || undefined,
    imageUrl: input.imageUrl || undefined,
  };
}

export function formFromEquipment(e: EquipmentResponse) {
  return {
    name: e.name ?? "",
    typeLabel: typeLabelFromEquipment(e),
    brand: e.brand ?? "",
    description: e.specifications ?? "",
    power: e.nominalPower ? `${e.nominalPower}W` : "",
    efficiency: e.efficiency
      ? e.efficiency <= 1
        ? `${Math.round(e.efficiency * 1000) / 10}%`
        : `${e.efficiency}%`
      : "",
    price: e.price != null ? String(e.price) : "",
    warranty: e.warrantyYears != null ? String(e.warrantyYears) : "",
    dimensions: "",
    weight: "",
  };
}
