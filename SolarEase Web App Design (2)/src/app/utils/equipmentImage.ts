const TYPE_FALLBACKS: Record<string, string> = {
  SOLAR_PANEL: "/equipment/panel.svg",
  NIGHT_PANEL: "/equipment/night-panel-400.jpg",
  INVERTER: "/equipment/inverter.svg",
  BATTERY: "/equipment/battery.svg",
  MOUNTING_SYSTEM: "/equipment/mounting.svg",
  CABLE: "/equipment/cable.svg",
  CIRCUIT_BREAKER_DC: "/equipment/breaker.svg",
  CIRCUIT_BREAKER_AC: "/equipment/breaker.svg",
  PROTECTION: "/equipment/breaker.svg",
};

export function resolveEquipmentImageUrl(
  imageUrl?: string | null,
  type?: string | null
): string | null {
  if (imageUrl?.trim()) {
    const url = imageUrl.trim();
    return url.startsWith("/") ? url : `/${url}`;
  }
  if (type && TYPE_FALLBACKS[type]) {
    return TYPE_FALLBACKS[type];
  }
  return null;
}

export function isAuthenticatedEquipmentImage(src: string): boolean {
  return src.startsWith("/api/");
}
