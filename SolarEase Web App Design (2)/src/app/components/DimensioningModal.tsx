import React, { useEffect, useState } from "react";
import { X, Sun, Moon, Zap, Loader2, ArrowRight, Info } from "lucide-react";
import equipmentService, { EquipmentResponse } from "../services/equipmentService";
import dimensioningService, {
  DimensioningRequest,
  DimensioningResponse,
  ComparisonResponse,
} from "../services/dimensioningService";

interface DimensioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectData: {
    latitude: number;
    longitude: number;
    availableArea: number;
    inclination: number;
    orientation: number;
  };
  onResult: (result: DimensioningResponse | null, comparison: ComparisonResponse | null) => void;
}

type PanelMode = "CLASSIC" | "NIGHT_PANEL" | "COMPARE";

export function DimensioningModal({
  isOpen,
  onClose,
  projectId,
  projectData,
  onResult,
}: DimensioningModalProps) {
  const [mode, setMode] = useState<PanelMode>("CLASSIC");
  const [loading, setLoading] = useState(false);
  const [panels, setPanels] = useState<EquipmentResponse[]>([]);
  const [nightPanels, setNightPanels] = useState<EquipmentResponse[]>([]);
  const [inverters, setInverters] = useState<EquipmentResponse[]>([]);

  const [formData, setFormData] = useState({
    area: String(projectData.availableArea || "25"),
    inclination: String(projectData.inclination || "35"),
    orientation: "SOUTH",
    roofType: "FLAT",
    panelId: "",
    nightPanelId: "",
    inverterId: "",
    dailyConsumptionKwh: "15",
  });

  useEffect(() => {
    if (isOpen) {
      equipmentService.getByType("SOLAR_PANEL").then(setPanels).catch(() => {});
      equipmentService.getByType("NIGHT_PANEL").then(setNightPanels).catch(() => {});
      equipmentService.getByType("INVERTER").then(setInverters).catch(() => {});
    }
  }, [isOpen]);

  const orientationMap: Record<string, string> = {
    "0": "SOUTH",
    "45": "SOUTH_WEST",
    "90": "WEST",
    "135": "NORTH_WEST",
    "180": "NORTH",
    "-45": "SOUTH_EAST",
    "-90": "EAST",
    "-135": "NORTH_EAST",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const baseRequest: DimensioningRequest = {
      projectId,
      area: parseFloat(formData.area),
      inclination: parseFloat(formData.inclination),
      orientation: formData.orientation as any,
      roofType: formData.roofType as any,
      latitude: projectData.latitude,
      longitude: projectData.longitude,
      panelId: formData.panelId ? parseInt(formData.panelId) : undefined,
      inverterId: formData.inverterId ? parseInt(formData.inverterId) : undefined,
      dailyConsumptionKwh: parseFloat(formData.dailyConsumptionKwh),
    };

    try {
      if (mode === "COMPARE") {
        baseRequest.nightPanelId = formData.nightPanelId
          ? parseInt(formData.nightPanelId)
          : undefined;
        const comparison = await dimensioningService.compare(baseRequest);
        onResult(null, comparison);
      } else if (mode === "NIGHT_PANEL") {
        baseRequest.panelType = "NIGHT_PANEL";
        baseRequest.nightPanelId = formData.nightPanelId
          ? parseInt(formData.nightPanelId)
          : undefined;
        const result = await dimensioningService.calculate(baseRequest);
        onResult(result, null);
      } else {
        baseRequest.panelType = "CLASSIC";
        const result = await dimensioningService.calculate(baseRequest);
        onResult(result, null);
      }
      onClose();
    } catch (err) {
      console.error("Dimensioning error:", err);
      alert("Erreur lors du dimensionnement. Vérifiez les paramètres.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dimensionnement Solaire</h2>
            <p className="text-sm text-gray-500 mt-0.5">Choisissez votre type de panneau</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ── Mode Selector ── */}
          <div className="grid grid-cols-3 gap-3">
            {/* Classic */}
            <button
              type="button"
              onClick={() => setMode("CLASSIC")}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                mode === "CLASSIC"
                  ? "border-[#4CAF50] bg-green-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                mode === "CLASSIC" ? "bg-[#4CAF50]" : "bg-gray-100"
              }`}>
                <Sun className={`w-5 h-5 ${mode === "CLASSIC" ? "text-white" : "text-gray-500"}`} />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Classique</h3>
              <p className="text-xs text-gray-500 mt-1">Panneaux solaires standard</p>
              {mode === "CLASSIC" && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#4CAF50] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            {/* Night Panel */}
            <button
              type="button"
              onClick={() => setMode("NIGHT_PANEL")}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                mode === "NIGHT_PANEL"
                  ? "border-indigo-500 bg-indigo-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                mode === "NIGHT_PANEL" ? "bg-indigo-500" : "bg-gray-100"
              }`}>
                <Moon className={`w-5 h-5 ${mode === "NIGHT_PANEL" ? "text-white" : "text-gray-500"}`} />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Night Panel</h3>
              <p className="text-xs text-gray-500 mt-1">Stockage intégré jour/nuit</p>
              {mode === "NIGHT_PANEL" && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            {/* Compare */}
            <button
              type="button"
              onClick={() => setMode("COMPARE")}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                mode === "COMPARE"
                  ? "border-amber-500 bg-amber-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                mode === "COMPARE" ? "bg-amber-500" : "bg-gray-100"
              }`}>
                <Zap className={`w-5 h-5 ${mode === "COMPARE" ? "text-white" : "text-gray-500"}`} />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Comparer</h3>
              <p className="text-xs text-gray-500 mt-1">Classique vs Night Panel</p>
              {mode === "COMPARE" && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Night Panel Info Banner */}
          {(mode === "NIGHT_PANEL" || mode === "COMPARE") && (
            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <Info className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-indigo-900">Technologie Night Panel</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Les Night Panels intègrent un stockage batterie dans chaque panneau, permettant de stocker
                  l'énergie produite le jour pour une utilisation nocturne. Taux d'autoconsommation jusqu'à 80%.
                </p>
              </div>
            </div>
          )}

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
              {/* Classic Panel */}
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

              {/* Night Panel */}
              {(mode === "NIGHT_PANEL" || mode === "COMPARE") && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    <Moon className="w-3 h-3 inline mr-1 text-indigo-500" />
                    Night Panel
                  </label>
                  <select
                    value={formData.nightPanelId}
                    onChange={(e) => setFormData({ ...formData, nightPanelId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="">Auto-sélection</option>
                    {nightPanels.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.nominalPower}W — {p.storageCapacityKwh} kWh stockage — {p.price} TND
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

          {/* ── Consumption (for Night Panel & Compare) ── */}
          {(mode === "NIGHT_PANEL" || mode === "COMPARE") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">3</span>
                Consommation
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Consommation journalière (kWh/jour)
                </label>
                <input
                  type="number" step="0.1" min="1"
                  value={formData.dailyConsumptionKwh}
                  onChange={(e) => setFormData({ ...formData, dailyConsumptionKwh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                  placeholder="Ex: 15"
                />
                <p className="text-xs text-gray-400 mt-1">Moyenne tunisienne : 12-18 kWh/jour pour un ménage</p>
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button" onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-white font-medium text-sm shadow-sm transition-all flex items-center gap-2 ${
                mode === "COMPARE"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : mode === "NIGHT_PANEL"
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : "bg-[#4CAF50] hover:bg-[#43A047]"
              } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
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
    </div>
  );
}
