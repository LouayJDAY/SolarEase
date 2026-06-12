/** Tunisia map defaults (PVGIS / OpenStreetMap) */
export const TUNISIA_CENTER: [number, number] = [34.0, 9.5];
export const TUNISIA_BOUNDS: [[number, number], [number, number]] = [
  [30.2, 7.5],
  [37.6, 11.6],
];
export const TUNISIA_ZOOM = 7;

export function isValidProjectCoordinates(
  lat?: number | null,
  lon?: number | null
): boolean {
  if (lat == null || lon == null) return false;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lon) < 0.0001) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function formatCoordinates(lat?: number | null, lon?: number | null): string {
  if (!isValidProjectCoordinates(lat, lon)) return "Non défini";
  return `${lat!.toFixed(5)}°, ${lon!.toFixed(5)}°`;
}

export function isWithinTunisiaBounds(lat: number, lon: number): boolean {
  const [[south, west], [north, east]] = TUNISIA_BOUNDS;
  return lat >= south && lat <= north && lon >= west && lon <= east;
}

export function parseCoordinateInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
