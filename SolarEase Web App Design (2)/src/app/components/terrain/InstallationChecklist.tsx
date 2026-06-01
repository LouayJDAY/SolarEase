import { Check, ListChecks } from "lucide-react";
import { INSTALLATION_PHASES, computeProgress } from "../../constants/installationPhases";

interface InstallationChecklistProps {
  completedSteps: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function InstallationChecklist({
  completedSteps,
  onChange,
  disabled,
}: InstallationChecklistProps) {
  const progress = computeProgress(completedSteps);
  const set = new Set(completedSteps);

  const toggle = (key: string) => {
    if (disabled) return;
    if (set.has(key)) {
      onChange(completedSteps.filter((k) => k !== key));
    } else {
      onChange([...completedSteps, key]);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5" />
          Phases d'installation
        </label>
        <span className="text-sm font-bold text-primary">
          {progress}%{" "}
          <span className="text-xs font-normal text-slate-400">
            ({completedSteps.length}/{INSTALLATION_PHASES.length} étapes)
          </span>
        </span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-2 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {INSTALLATION_PHASES.map((phase) => {
          const checked = set.has(phase.key);
          return (
            <li key={phase.key}>
              <button
                type="button"
                onClick={() => toggle(phase.key)}
                disabled={disabled}
                className={`w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-lg border transition-all ${
                  checked
                    ? "border-primary/40 bg-primary/5"
                    : "border-slate-200 hover:border-primary/30 hover:bg-slate-50"
                } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-md border-2 flex-shrink-0 transition-colors ${
                    checked
                      ? "bg-primary border-primary text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span
                    className={`block text-sm font-medium ${
                      checked ? "text-secondary" : "text-slate-700"
                    }`}
                  >
                    {phase.label}
                  </span>
                  <span className="block text-xs text-slate-400 mt-0.5">
                    {phase.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default InstallationChecklist;
