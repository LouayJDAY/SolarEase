import type { DimensioningResponse } from "../services/dimensioningService";
import type { ProjectResponse } from "../services/projectService";

const ORIENTATION_LABELS: Record<string, string> = {
  NORTH: "Nord",
  NORTH_EAST: "Nord-Est",
  EAST: "Est",
  SOUTH_EAST: "Sud-Est",
  SOUTH: "Sud",
  SOUTH_WEST: "Sud-Ouest",
  WEST: "Ouest",
  NORTH_WEST: "Nord-Ouest",
};

export function formatRoofOrientation(
  orientation?: string | number | null
): string {
  if (orientation == null || orientation === "") return "—";
  if (typeof orientation === "number") return `${orientation}°`;
  return ORIENTATION_LABELS[orientation] ?? String(orientation).replace(/_/g, "-");
}

export function resolvePeakPowerKw(
  dimensioning: DimensioningResponse | null,
  project: ProjectResponse
): number {
  const inst = dimensioning?.installation;
  if (inst?.totalCapacityKw != null && inst.totalCapacityKw > 0) {
    return inst.totalCapacityKw;
  }
  const panelPower = dimensioning?.panel?.nominalPower;
  const panelCount = inst?.panelCount;
  if (panelPower && panelCount && panelCount > 0) {
    return Math.round(((panelPower * panelCount) / 1000) * 100) / 100;
  }
  return project.peakPower ?? 0;
}

export function resolveAvailableArea(
  dimensioning: DimensioningResponse | null,
  project: ProjectResponse
): string {
  const area = dimensioning?.roof?.area ?? project.availableArea;
  if (area == null || area <= 0) return "—";
  return `${area} m²`;
}

export function resolveInclination(
  dimensioning: DimensioningResponse | null,
  project: ProjectResponse
): number | string {
  const inclination = dimensioning?.roof?.inclination ?? project.inclination;
  return inclination ?? "—";
}

export function resolveOrientationLabel(
  dimensioning: DimensioningResponse | null,
  project: ProjectResponse
): string {
  const roofOrientation = dimensioning?.roof?.orientation;
  if (roofOrientation != null && roofOrientation !== "") {
    return formatRoofOrientation(roofOrientation);
  }
  if (project.orientation != null) {
    return `${project.orientation}°`;
  }
  return "—";
}
