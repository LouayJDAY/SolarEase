import { Cable, Sparkles, Zap } from "lucide-react";
import type { RecommendedKit } from "../../services/dimensioningService";

interface TerrainKitReminderProps {
  kit?: RecommendedKit | null;
}

export function TerrainKitReminder({ kit }: TerrainKitReminderProps) {
  if (!kit || (!kit.inverter && !kit.dcCable && !kit.acCable && !kit.dcBreaker && !kit.acBreaker)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-secondary font-semibold text-sm mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        Rappel kit recommandé (RAG)
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-700">
        {kit.inverter && (
          <li className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>
              <strong>Onduleur</strong> · {kit.inverter.brand} {kit.inverter.model}
              {kit.inverter.powerKw ? ` (${kit.inverter.powerKw} kW)` : ""}
            </span>
          </li>
        )}
        {kit.dcCable && (
          <li className="flex items-start gap-2">
            <Cable className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>
              <strong>Câble DC</strong> · {kit.dcCable.sectionMm2} mm²
              {kit.dcCable.brand ? ` — ${kit.dcCable.brand}` : ""}
            </span>
          </li>
        )}
        {kit.acCable && (
          <li className="flex items-start gap-2">
            <Cable className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>
              <strong>Câble AC</strong> · {kit.acCable.sectionMm2} mm²
              {kit.acCable.brand ? ` — ${kit.acCable.brand}` : ""}
            </span>
          </li>
        )}
        {kit.dcBreaker && (
          <li className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>
              <strong>Disjoncteur DC</strong> · {kit.dcBreaker.brand}{" "}
              {kit.dcBreaker.reference} ({kit.dcBreaker.ratingA} A)
            </span>
          </li>
        )}
        {kit.acBreaker && (
          <li className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>
              <strong>Disjoncteur AC</strong> · {kit.acBreaker.brand}{" "}
              {kit.acBreaker.reference} ({kit.acBreaker.ratingA} A)
            </span>
          </li>
        )}
      </ul>
      <p className="text-xs text-slate-500 mt-3">
        Vérifiez sur place que le matériel correspond au kit recommandé avant le raccordement.
      </p>
    </div>
  );
}

export default TerrainKitReminder;
