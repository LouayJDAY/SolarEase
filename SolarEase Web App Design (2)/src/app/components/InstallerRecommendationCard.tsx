import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Cable,
  Shield,
  MessageSquare,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  WifiOff,
} from "lucide-react";
import { InstallerRecommendation } from "../services/dimensioningService";

interface InstallerRecommendationCardProps {
  recommendation?: InstallerRecommendation | null;
  fallbackText?: string;
  loading?: boolean;
  onRegenerate?: () => Promise<void>;
}

function verdictStyle(verdict?: string) {
  switch (verdict) {
    case "OK":
      return {
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
        label: "Compatible",
      };
    case "ATTENTION":
      return {
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        icon: AlertTriangle,
        label: "Attention",
      };
    default:
      return {
        badge: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
        label: "Non compatible",
      };
  }
}

function formatTnd(value?: number) {
  if (value == null) return "—";
  return `${Math.round(value).toLocaleString("fr-TN")} TND`;
}

function phaseLabel(phase?: string) {
  if (!phase) return "";
  return phase === "TRI" ? "Triphasé" : "Monophasé";
}

export function InstallerRecommendationCard({
  recommendation,
  fallbackText,
  loading = false,
  onRegenerate,
}: InstallerRecommendationCardProps) {
  const [showSources, setShowSources] = useState(false);
  const kit = recommendation?.recommendedKit;
  const verdict = verdictStyle(recommendation?.verdict);
  const VerdictIcon = verdict.icon;

  const hasStructured = !!recommendation?.recommendedKit;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary">
              Recommandation IA
            </h2>
            <p className="text-xs text-purple-600 mt-0.5">
              Kit catalogue société · pgvector · Ollama
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {recommendation && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${verdict.badge}`}
            >
              <VerdictIcon className="w-4 h-4" />
              {recommendation.compatibilityScore}/100 · {verdict.label}
            </div>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 text-sm font-medium hover:bg-purple-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Régénérer
            </button>
          )}
        </div>
      </div>

      {loading && !hasStructured && (
        <div className="flex items-center gap-2 text-sm text-purple-600 py-4">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Analyse du kit en cours…
        </div>
      )}

      {/* Structured kit */}
      {hasStructured && kit && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Inverter */}
            {kit.inverter && (
              <div className="bg-white/80 rounded-lg border border-purple-100 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  Onduleur
                </div>
                <p className="font-semibold text-secondary">
                  {kit.inverter.brand} {kit.inverter.model}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {kit.inverter.powerKw.toFixed(1)} kW
                  {kit.inverter.phase
                    ? ` · ${phaseLabel(kit.inverter.phase)}`
                    : ""}
                </p>
                {kit.inverter.price != null && (
                  <p className="text-sm font-medium text-emerald-700 mt-1">
                    {formatTnd(kit.inverter.price)}
                  </p>
                )}
              </div>
            )}

            {/* Cables */}
            {(kit.dcCable || kit.acCable) && (
              <div className="bg-white/80 rounded-lg border border-purple-100 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                  <Cable className="w-3.5 h-3.5" />
                  Câblage
                </div>
                {kit.dcCable && (
                  <p className="text-sm text-secondary">
                    DC {kit.dcCable.sectionMm2} mm²
                    {kit.dcCable.standard
                      ? ` · ${kit.dcCable.standard}`
                      : ""}
                  </p>
                )}
                {kit.acCable && (
                  <p className="text-sm text-secondary mt-1">
                    AC {kit.acCable.sectionMm2} mm²
                  </p>
                )}
              </div>
            )}

            {/* DC Breaker */}
            {kit.dcBreaker && (
              <div className="bg-white/80 rounded-lg border border-purple-100 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  Disjoncteur DC
                </div>
                <p className="font-semibold text-secondary">
                  {kit.dcBreaker.brand}
                </p>
                <p className="text-sm text-slate-500">
                  {kit.dcBreaker.reference} · {kit.dcBreaker.ratingA} A
                </p>
              </div>
            )}

            {/* AC Breaker */}
            {kit.acBreaker && (
              <div className="bg-white/80 rounded-lg border border-purple-100 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  Disjoncteur AC
                </div>
                <p className="font-semibold text-secondary">
                  {kit.acBreaker.brand}
                </p>
                <p className="text-sm text-slate-500">
                  {kit.acBreaker.reference} · {kit.acBreaker.ratingA} A
                </p>
              </div>
            )}
          </div>

          {kit.totalKitPrice != null && (
            <div className="flex items-center justify-between bg-white/60 rounded-lg border border-purple-100 px-4 py-3">
              <span className="text-sm font-medium text-slate-600">
                Prix kit (onduleur + protections)
              </span>
              <span className="text-base font-bold text-secondary">
                {formatTnd(kit.totalKitPrice)}
              </span>
            </div>
          )}

          {/* Alternatives */}
          {recommendation?.alternatives &&
            recommendation.alternatives.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Alternatives catalogue
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendation.alternatives.map((alt) => (
                    <span
                      key={`${alt.brand}-${alt.model}`}
                      className="text-xs bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600"
                    >
                      {alt.brand} {alt.model} ({alt.powerKw.toFixed(1)} kW)
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Alerts */}
          {recommendation?.alerts && recommendation.alerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                Alertes techniques
              </div>
              <ul className="space-y-1">
                {recommendation.alerts.map((alert, i) => (
                  <li key={i} className="text-sm text-amber-800">
                    • {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Client arguments */}
          {recommendation?.clientArguments &&
            recommendation.clientArguments.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Arguments client
                </div>
                <ul className="space-y-1">
                  {recommendation.clientArguments.map((arg, i) => (
                    <li key={i} className="text-sm text-emerald-800">
                      • {arg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Terrain checklist */}
          {recommendation?.terrainChecklist &&
            recommendation.terrainChecklist.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-2">
                  <ClipboardList className="w-4 h-4" />
                  Checklist terrain
                </div>
                <ul className="space-y-1">
                  {recommendation.terrainChecklist.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-300"
                        readOnly
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Narrative summary */}
          {(recommendation?.narrativeSummary || fallbackText) && (
            <p className="text-sm text-secondary leading-relaxed border-t border-purple-100 pt-4">
              {recommendation?.narrativeSummary || fallbackText}
            </p>
          )}

          {/* RAG sources (collapsible) */}
          {recommendation?.ragSources &&
            recommendation.ragSources.length > 0 && (
              <div>
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                >
                  {showSources ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  Sources RAG ({recommendation.ragSources.length})
                </button>
                {showSources && (
                  <ul className="mt-2 space-y-0.5">
                    {recommendation.ragSources.map((src, i) => (
                      <li key={i} className="text-xs text-slate-500">
                        {src}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
        </div>
      )}

      {/* Fallback when no structured data yet */}
      {!hasStructured && !loading && fallbackText && (
        <p className="text-secondary leading-relaxed whitespace-pre-line">
          {fallbackText}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-purple-100">
        <div className="flex items-center gap-2 text-xs text-purple-600">
          <Sparkles className="w-3 h-3" />
          <span className="font-medium">Powered by Ollama AI</span>
        </div>
        {recommendation?.fallback && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <WifiOff className="w-3 h-3" />
            Mode hors-ligne (kit déterministe)
          </div>
        )}
      </div>
    </div>
  );
}
