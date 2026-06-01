import { AlertTriangle } from "lucide-react";
import {
  BLOCKAGE_TYPES,
  BLOCKAGE_IMPACTS,
  type BlockageImpactKey,
  type BlockageTypeKey,
} from "../../constants/installationPhases";

interface BlockageFormProps {
  blockageType?: BlockageTypeKey | "";
  blockageImpact?: BlockageImpactKey | "";
  blockageReason?: string;
  onChange: (patch: {
    blockageType?: BlockageTypeKey | "";
    blockageImpact?: BlockageImpactKey | "";
    blockageReason?: string;
  }) => void;
}

export function BlockageForm({
  blockageType = "",
  blockageImpact = "",
  blockageReason = "",
  onChange,
}: BlockageFormProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
        <AlertTriangle className="w-4 h-4" />
        Détails du blocage
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Type de blocage
          </label>
          <select
            value={blockageType}
            onChange={(e) =>
              onChange({ blockageType: e.target.value as BlockageTypeKey | "" })
            }
            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <option value="">Sélectionner…</option>
            {BLOCKAGE_TYPES.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Impact estimé
          </label>
          <select
            value={blockageImpact}
            onChange={(e) =>
              onChange({ blockageImpact: e.target.value as BlockageImpactKey | "" })
            }
            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <option value="">Sélectionner…</option>
            {BLOCKAGE_IMPACTS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <textarea
        value={blockageReason}
        onChange={(e) => onChange({ blockageReason: e.target.value })}
        rows={2}
        placeholder="Décrivez précisément le blocage (matériel manquant, refus client, météo…)"
        className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
      />
    </div>
  );
}

export default BlockageForm;
