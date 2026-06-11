import React, { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Send,
  MapPin,
  Zap,
  Sun,
  DollarSign,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Compass,
  Loader2,
} from "lucide-react";
import demandService, { DemandCreateRequest } from "../../services/demandService";
import { demandCreateSchema } from "../../validation/projectSchemas";

const initialForm: DemandCreateRequest = {
  name: "",
  description: "",
  location: "",
  latitude: undefined,
  longitude: undefined,
  peakPower: undefined,
  availableArea: undefined,
  inclination: undefined,
  orientation: undefined,
  budget: undefined,
};

type Step = 0 | 1 | 2;

const STEP_LABELS = [
  "Informations générales",
  "Caractéristiques techniques",
  "Récapitulatif & envoi",
];

export function ClientRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<DemandCreateRequest>(initialForm);
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const set = (key: keyof DemandCreateRequest, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    if (step === 0) {
      const parsed = demandCreateSchema.safeParse({ name: form.name?.trim() });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Le nom du projet est requis.");
        return;
      }
    }
    setStep((s) => Math.min(2, (s + 1) as Step));
  };

  const goBack = () => setStep((s) => Math.max(0, (s - 1) as Step));

  const handleGeolocate = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Géolocalisation indisponible sur ce navigateur.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", Number(pos.coords.latitude.toFixed(6)));
        set("longitude", Number(pos.coords.longitude.toFixed(6)));
        toast.success("Position détectée");
        setGeoLoading(false);
      },
      () => {
        toast.error("Impossible d'obtenir votre position.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = demandCreateSchema.safeParse({
      name: form.name?.trim(),
      description: form.description?.trim() || undefined,
      location: form.location?.trim() || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
      availableArea: form.availableArea,
      inclination: form.inclination,
      orientation: form.orientation,
      budget: form.budget,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides.");
      setStep(0);
      return;
    }
    setSubmitting(true);
    try {
      await demandService.createDemand({ ...form, ...parsed.data });
      toast.success("Votre demande a été soumise avec succès !");
      navigate("/client/requests");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Impossible de soumettre la demande");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Nouvelle demande de projet</h1>
        <p className="text-gray-600">
          Décrivez votre projet en 3 étapes. Notre équipe vous recontactera sous 48h.
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEP_LABELS.map((label, idx) => {
          const active = step === idx;
          const done = step > idx;
          return (
            <li key={label} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-2 ${
                  active ? "text-primary" : done ? "text-secondary" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    active
                      ? "bg-primary text-white"
                      : done
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </span>
                <span className="hidden sm:block text-xs font-medium">{label}</span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    done ? "bg-primary" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Step 0 : general info ─────────────────────────────────────── */}
        {step === 0 && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-secondary flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                Informations générales
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du projet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Installation solaire résidentielle"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="Décrivez votre projet et vos besoins..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-secondary flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Localisation
                </h2>
                <button
                  type="button"
                  onClick={handleGeolocate}
                  disabled={geoLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-60"
                >
                  {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
                  Utiliser ma position
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse / Ville</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Ex: Tunis, Ariana..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude ?? ""}
                    onChange={(e) => set("latitude", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="36.8..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude ?? ""}
                    onChange={(e) => set("longitude", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="10.1..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Step 1 : technical ─────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-secondary flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Caractéristiques techniques
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puissance souhaitée (kWc)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.peakPower ?? ""}
                    onChange={(e) => set("peakPower", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 10"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surface disponible (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.availableArea ?? ""}
                    onChange={(e) => set("availableArea", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inclinaison (°)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="90"
                    value={form.inclination ?? ""}
                    onChange={(e) => set("inclination", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 30"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orientation (°)</label>
                  <input
                    type="number"
                    step="1"
                    min="-180"
                    max="180"
                    value={form.orientation ?? ""}
                    onChange={(e) => set("orientation", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Ex: 180 (Sud)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-secondary flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Budget
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget estimé (TND)</label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={form.budget ?? ""}
                  onChange={(e) => set("budget", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Ex: 15000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </>
        )}

        {/* ── Step 2 : summary ───────────────────────────────────────────── */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold text-secondary flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Récapitulatif
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <SummaryRow label="Nom du projet" value={form.name || "—"} />
              <SummaryRow label="Description" value={form.description || "—"} />
              <SummaryRow label="Localisation" value={form.location || "—"} />
              <SummaryRow
                label="Coordonnées GPS"
                value={
                  form.latitude != null && form.longitude != null
                    ? `${form.latitude}, ${form.longitude}`
                    : "—"
                }
              />
              <SummaryRow label="Puissance" value={form.peakPower != null ? `${form.peakPower} kWc` : "—"} />
              <SummaryRow label="Surface" value={form.availableArea != null ? `${form.availableArea} m²` : "—"} />
              <SummaryRow label="Inclinaison" value={form.inclination != null ? `${form.inclination}°` : "—"} />
              <SummaryRow label="Orientation" value={form.orientation != null ? `${form.orientation}°` : "—"} />
              <SummaryRow label="Budget" value={form.budget != null ? `${form.budget.toLocaleString("fr-FR")} TND` : "—"} />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-secondary">
              <p className="font-medium mb-1">Et après ?</p>
              <p className="text-muted-foreground">
                Votre demande sera transmise immédiatement à notre équipe administrative pour qualification.
                Vous serez notifié dès que votre dossier sera validé ou si un complément est nécessaire.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0 || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Étape suivante
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {submitting ? "Envoi en cours..." : "Soumettre ma demande"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 last:border-b-0 pb-2 last:pb-0">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm text-secondary font-medium">{value}</p>
    </div>
  );
}
