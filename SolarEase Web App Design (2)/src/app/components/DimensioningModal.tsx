import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Sun, Loader2, ArrowRight } from "lucide-react";
import equipmentService, { EquipmentResponse } from "../services/equipmentService";
import dimensioningService, {
  DimensioningRequest,
  DimensioningResponse,
  ComparisonResponse,
} from "../services/dimensioningService";
import { LocationPicker, LocationValue } from "./LocationPicker";
import { LocationMap } from "./LocationMap";
import { formatCoordinates, isValidProjectCoordinates } from "../utils/geo";
import { Moon, GitCompare } from "lucide-react";
import {
  DIMENSIONING_MODE_OPTIONS,
  DimensioningMode,
} from "../constants/panelTypes";
import {
  validateDimensioningConsumption,
  validateDimensioningPanelSelection,
} from "../validation/dimensioningSchemas";
import { parseDemandConsumption } from "../utils/parseDemandConsumption";

interface DimensioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectData: {
    location?: string | null;
    latitude: number | null;
    longitude: number | null;
    availableArea: number | null;
    inclination: number | null;
    orientation: number | null;
    description?: string | null;
  };
  onResult: (result: DimensioningResponse | null, comparison: ComparisonResponse | null) => void;
  onLocationUpdate?: (value: LocationValue) => Promise<boolean | void>;
}

type PanelMode = DimensioningMode;

const modeIcons: Record<DimensioningMode, React.ReactNode> = {
  CLASSIC: <Sun className="w-5 h-5" />,
  NIGHT_PANEL: <Moon className="w-5 h-5" />,
  COMPARE: <GitCompare className="w-5 h-5" />,
};

export function DimensioningModal({
  isOpen,
  onClose,
  projectId,
  projectData,
  onResult,
  onLocationUpdate,
}: DimensioningModalProps) {
  const orientationMap: Record<number, string> = {
    0: "SOUTH",
    45: "SOUTH_WEST",
    90: "WEST",
    135: "NORTH_WEST",
    180: "NORTH",
    [-45]: "SOUTH_EAST",
    [-90]: "EAST",
    [-135]: "NORTH_EAST",
  };

  const mappedOrientation =
    orientationMap[Math.round(projectData.orientation ?? 0)] || "SOUTH";

  const [siteLocation, setSiteLocation] = useState<LocationValue>({
    location: projectData.location || "",
    latitude: isValidProjectCoordinates(projectData.latitude, projectData.longitude)
      ? projectData.latitude
      : null,
    longitude: isValidProjectCoordinates(projectData.latitude, projectData.longitude)
      ? projectData.longitude
      : null,
  });
  const [savingLocation, setSavingLocation] = useState(false);

  const hasValidCoordinates = isValidProjectCoordinates(
    siteLocation.latitude,
    siteLocation.longitude
  );

  useEffect(() => {
    if (!isOpen) return;
    setSiteLocation({
      location: projectData.location || "",
      latitude: isValidProjectCoordinates(projectData.latitude, projectData.longitude)
        ? projectData.latitude
        : null,
      longitude: isValidProjectCoordinates(projectData.latitude, projectData.longitude)
        ? projectData.longitude
        : null,
    });
  }, [isOpen, projectData.location, projectData.latitude, projectData.longitude]);

  const handleLocationChange = async (value: LocationValue) => {
    setSiteLocation(value);
    if (!onLocationUpdate || !isValidProjectCoordinates(value.latitude, value.longitude)) return;
    setSavingLocation(true);
    try {
      await onLocationUpdate(value);
    } finally {
      setSavingLocation(false);
    }
  };

  const [mode, setMode] = useState<PanelMode>("CLASSIC");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [panels, setPanels] = useState<EquipmentResponse[]>([]);
  const [nightPanels, setNightPanels] = useState<EquipmentResponse[]>([]);
  const [inverters, setInverters] = useState<EquipmentResponse[]>([]);

  const ELECTRICITY_PRICE_TND_KWH = 0.28;

  const [consumptionInputMode, setConsumptionInputMode] = useState<"daily" | "quarterly">("daily");
  const [formData, setFormData] = useState({
    area:
      projectData.availableArea != null ? String(projectData.availableArea) : "",
    inclination:
      projectData.inclination != null ? String(projectData.inclination) : "",
    orientation: mappedOrientation,
    roofType: "FLAT",
    panelId: "",
    nightPanelId: "",
    inverterId: "",
    dailyConsumptionKwh: "",
    quarterlyBillTnd: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    document.body.setAttribute("data-leaflet-modal-open", "true");
    return () => document.body.removeAttribute("data-leaflet-modal-open");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    equipmentService.getByType("SOLAR_PANEL").then(setPanels).catch(() => setPanels([]));
    equipmentService.getByType("NIGHT_PANEL").then(setNightPanels).catch(() => setNightPanels([]));
    equipmentService.getByType("INVERTER").then(setInverters).catch(() => {});
    setFormData((prev) => ({ ...prev, panelId: "", nightPanelId: "" }));

    const parsed = parseDemandConsumption(projectData.description);
    if (parsed.quarterlyBillTnd || parsed.dailyConsumptionKwh || parsed.roofAreaM2) {
      if (parsed.quarterlyBillTnd) setConsumptionInputMode("quarterly");
      else if (parsed.dailyConsumptionKwh) setConsumptionInputMode("daily");
      setFormData((prev) => ({
        ...prev,
        panelId: "",
        nightPanelId: "",
        area:
          parsed.roofAreaM2 != null
            ? String(parsed.roofAreaM2)
            : projectData.availableArea != null && projectData.availableArea > 0
              ? String(projectData.availableArea)
              : prev.area,
        quarterlyBillTnd:
          parsed.quarterlyBillTnd != null ? String(parsed.quarterlyBillTnd) : prev.quarterlyBillTnd,
        dailyConsumptionKwh:
          parsed.dailyConsumptionKwh != null
            ? String(parsed.dailyConsumptionKwh)
            : prev.dailyConsumptionKwh,
      }));
    }
  }, [isOpen, mode, projectData.description, projectData.availableArea, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const area = parseFloat(formData.area);
    const inclination = parseFloat(formData.inclination);

    if (!hasValidCoordinates) {
      setErrorMessage(
        "Placez le site sur la carte ci-dessus pour activer les données météo PVGIS."
      );
      return;
    }

    if (Number.isNaN(area) || area <= 0) {
      setErrorMessage("La surface doit être un nombre positif.");
      return;
    }

    if (Number.isNaN(inclination) || inclination < 0 || inclination > 90) {
      setErrorMessage("L'inclinaison doit être comprise entre 0 et 90°.");
      return;
    }

    const panelErr = validateDimensioningPanelSelection(
      mode,
      formData.panelId,
      formData.nightPanelId
    );
    if (panelErr) {
      setErrorMessage(panelErr);
      return;
    }

    const consumptionErr = validateDimensioningConsumption(
      mode,
      consumptionInputMode,
      formData.dailyConsumptionKwh,
      formData.quarterlyBillTnd
    );
    if (consumptionErr) {
      setErrorMessage(consumptionErr);
      return;
    }

    const dailyConsumption = parseFloat(formData.dailyConsumptionKwh);
    const quarterlyBill = parseFloat(formData.quarterlyBillTnd);
    const hasDailyInput = !Number.isNaN(dailyConsumption) && dailyConsumption > 0;
    const hasQuarterlyInput = !Number.isNaN(quarterlyBill) && quarterlyBill > 0;

    setLoading(true);

    const baseRequest: DimensioningRequest = {
      projectId,
      area,
      inclination,
      orientation: formData.orientation as any,
      roofType: formData.roofType as any,
      latitude: siteLocation.latitude!,
      longitude: siteLocation.longitude!,
      panelId: formData.panelId ? parseInt(formData.panelId) : undefined,
      nightPanelId: formData.nightPanelId ? parseInt(formData.nightPanelId) : undefined,
      inverterId: formData.inverterId ? parseInt(formData.inverterId) : undefined,
      dailyConsumptionKwh:
        consumptionInputMode === "daily" && hasDailyInput ? dailyConsumption : undefined,
      quarterlyBillTnd:
        consumptionInputMode === "quarterly" && hasQuarterlyInput ? quarterlyBill : undefined,
      panelType: mode === "NIGHT_PANEL" ? "NIGHT_PANEL" : "CLASSIC",
    };

    try {
      if (mode === "COMPARE") {
        const comparison = await dimensioningService.compare(baseRequest);
        onResult(null, comparison);
      } else {
        const result = await dimensioningService.calculate(baseRequest);
        onResult(result, null);
      }
      onClose();
    } catch (err) {
      console.error("Dimensioning error:", err);
      setErrorMessage("Erreur lors du dimensionnement. Vérifiez les paramètres saisis ou réessayez dans quelques instants.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative isolate bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        data-leaflet-modal="true"
      >
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dimensionnement Solaire</h2>
            <p className="text-sm text-gray-500 mt-0.5">Classique, Night Panel ou comparaison</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Carte fixe en haut — le formulaire scroll en dessous */}
        <div className="modal-map-pin px-6 pt-4 pb-3 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-secondary">Site d&apos;installation</p>
            {savingLocation && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Enregistrement…
              </span>
            )}
            {hasValidCoordinates && !savingLocation && (
              <span className="text-xs font-mono text-muted-foreground">
                {formatCoordinates(siteLocation.latitude, siteLocation.longitude)}
              </span>
            )}
          </div>
          <LocationPicker
            value={siteLocation}
            onChange={handleLocationChange}
            compact
            mapDetached
            showStatus={!hasValidCoordinates}
          />
          <LocationMap
            value={siteLocation}
            onChange={handleLocationChange}
            compact
            modal
            active={isOpen}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="modal-body-scroll flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Adresse</p>
              <p className="font-medium text-secondary line-clamp-2">
                {siteLocation.location || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Surface initiale</p>
              <p className="font-medium text-secondary">
                {projectData.availableArea != null ? `${projectData.availableArea} m²` : "—"}
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* ── Dimensioning mode ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIMENSIONING_MODE_OPTIONS.map((option) => {
              const selected = mode === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setMode(option.code)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    selected
                      ? `${option.accentBg} shadow-md`
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  style={selected ? { borderColor: option.accent } : undefined}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: selected ? option.accent : "#f3f4f6",
                      color: selected ? "#fff" : "#6b7280",
                    }}
                  >
                    {modeIcons[option.code]}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900">{option.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  {selected && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: option.accent }}
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Roof Parameters ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">1</span>
              Paramètres du toit
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Surface (m²)</label>
                <input
                  type="number" step="0.1" required
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Inclinaison (°)</label>
                <input
                  type="number" min="0" max="90" required
                  value={formData.inclination}
                  onChange={(e) => setFormData({ ...formData, inclination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Orientation</label>
                <select
                  value={formData.orientation}
                  onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white"
                >
                  <option value="SOUTH">Sud</option>
                  <option value="SOUTH_EAST">Sud-Est</option>
                  <option value="SOUTH_WEST">Sud-Ouest</option>
                  <option value="EAST">Est</option>
                  <option value="WEST">Ouest</option>
                  <option value="NORTH_EAST">Nord-Est</option>
                  <option value="NORTH_WEST">Nord-Ouest</option>
                  <option value="NORTH">Nord</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Type de toit</label>
                <select
                  value={formData.roofType}
                  onChange={(e) => setFormData({ ...formData, roofType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white"
                >
                  <option value="FLAT">Plat</option>
                  <option value="PITCHED_TILES">Tuiles</option>
                  <option value="PITCHED_SLATE">Ardoise</option>
                  <option value="PITCHED_STEEL">Bac acier</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Equipment Selection ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">2</span>
              Équipements
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {(mode === "CLASSIC" || mode === "COMPARE") && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    <Sun className="w-3 h-3 inline mr-1 text-amber-500" />
                    Panneau classique
                  </label>
                  <select
                    value={formData.panelId}
                    onChange={(e) => setFormData({ ...formData, panelId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white"
                  >
                    <option value="">Auto-sélection</option>
                    {panels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.nominalPower}W — {p.price} TND
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(mode === "NIGHT_PANEL" || mode === "COMPARE") && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    <Moon className="w-3 h-3 inline mr-1 text-indigo-500" />
                    Panneau Night Panel
                  </label>
                  <select
                    value={formData.nightPanelId}
                    onChange={(e) => setFormData({ ...formData, nightPanelId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white"
                  >
                    <option value="">Auto-sélection</option>
                    {nightPanels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.nominalPower}W — {p.storageCapacityKwh ?? "?"} kWh — {p.price} TND
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700">
                    Consommation client (facture STEG)
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Optionnel en classique — sans saisie, le dimensionnement utilise uniquement la
                    surface. Avec saisie : puissance = min(besoin facture, capacité toit).
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConsumptionInputMode("daily")}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      consumptionInputMode === "daily"
                        ? "border-[#4CAF50] bg-white text-[#2E7D32]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    kWh / jour
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsumptionInputMode("quarterly")}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      consumptionInputMode === "quarterly"
                        ? "border-[#4CAF50] bg-white text-[#2E7D32]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    Facture trim. (TND)
                  </button>
                </div>
                {consumptionInputMode === "daily" ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 15 (laisser vide = surface seule)"
                    value={formData.dailyConsumptionKwh}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyConsumptionKwh: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white"
                  />
                ) : (
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="Ex: 118.912 TND / trimestre (STEG)"
                    value={formData.quarterlyBillTnd}
                    onChange={(e) =>
                      setFormData({ ...formData, quarterlyBillTnd: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white"
                  />
                )}
              </div>

              {/* Inverter */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Onduleur</label>
                <select
                  value={formData.inverterId}
                  onChange={(e) => setFormData({ ...formData, inverterId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white"
                >
                  <option value="">Auto-sélection</option>
                  {inverters.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} — {inv.nominalPower / 1000}kW — {inv.price} TND
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          </div>

          {/* ── Submit ── */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
            <button
              type="button" onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={loading || !hasValidCoordinates}
              className={`px-6 py-2.5 rounded-lg text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2 bg-[#4CAF50] hover:bg-[#43A047] ${
                loading || !hasValidCoordinates ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  {mode === "COMPARE" ? "Comparer" : "Dimensionner"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
