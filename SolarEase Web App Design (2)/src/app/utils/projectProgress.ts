import type { ProjectResponse } from "../services/projectService";
import type { ProjectStep } from "../components/client/ProjectStepper";

const STATUS_PHASE_LABELS: Record<string, string> = {
  CREATED: "Étude en cours",
  EN_PREPARATION: "En préparation",
  INSTALLATEUR_AFFECTE: "Installateur affecté",
  IN_PROGRESS: "Installation en cours",
  COMPLETED: "Projet terminé",
  CANCELLED: "Projet annulé",
};

const STEP_ORDER: ProjectStep[] = [
  "STUDY",
  "VALIDATION",
  "INSTALLATION",
  "COMMISSIONING",
  "COMPLETED",
];

const INSTALLATION_PHASES = new Set(["PREPARATION", "STRUCTURE", "PV", "ELECTRIQUE"]);
const COMMISSIONING_PHASES = new Set(["TESTS"]);
const FINAL_PHASES = new Set(["ADMIN_STEG"]);

/** Progress % from API field updates, not hardcoded status guesses. */
export function getProjectProgressPercent(project: ProjectResponse): number {
  if (project.currentProgress != null && project.currentProgress > 0) {
    return Math.min(100, Math.max(0, project.currentProgress));
  }
  if (project.status === "COMPLETED") return 100;
  return 0;
}

/** Phase label from installer field updates when available. */
export function getProjectPhaseLabel(project: ProjectResponse): string {
  if (project.currentPhaseLabel?.trim()) {
    return project.currentPhaseLabel.trim();
  }
  const fieldStatus = project.currentFieldStatus?.toUpperCase();
  if (fieldStatus === "EN_INSTALLATION") return "Installation en cours";
  if (fieldStatus === "SUR_SITE") return "Sur site";
  if (fieldStatus === "EN_DEPLACEMENT") return "En déplacement";
  if (fieldStatus === "FIN_CHANTIER") return "Fin de chantier";
  if (fieldStatus === "BLOCAGE") return "Blocage signalé";
  return STATUS_PHASE_LABELS[project.status] ?? project.status;
}

const STATUS_TO_STEP: Record<string, ProjectStep> = {
  CREATED: "STUDY",
  EN_PREPARATION: "STUDY",
  INSTALLATEUR_AFFECTE: "VALIDATION",
  IN_PROGRESS: "INSTALLATION",
  COMPLETED: "COMPLETED",
  CANCELLED: "STUDY",
};

function phaseToStep(phase?: string | null): ProjectStep | null {
  if (!phase) return null;
  const key = phase.toUpperCase();
  if (FINAL_PHASES.has(key)) return "COMPLETED";
  if (COMMISSIONING_PHASES.has(key)) return "COMMISSIONING";
  if (INSTALLATION_PHASES.has(key)) return "INSTALLATION";
  return null;
}

function fieldStatusToStep(status?: string | null): ProjectStep | null {
  if (!status) return null;
  switch (status.toUpperCase()) {
    case "FIN_CHANTIER":
      return "COMMISSIONING";
    case "EN_INSTALLATION":
    case "SUR_SITE":
    case "EN_DEPLACEMENT":
      return "INSTALLATION";
    default:
      return null;
  }
}

/** Current step: field phases/status first, then project workflow status. */
export function getProjectCurrentStep(project: ProjectResponse): ProjectStep {
  if (project.status === "COMPLETED") return "COMPLETED";
  if (project.status === "CANCELLED") return "STUDY";

  const fromPhase = phaseToStep(project.currentPhase);
  if (fromPhase) return fromPhase;

  const fromField = fieldStatusToStep(project.currentFieldStatus);
  if (fromField) return fromField;

  if ((project.currentProgress ?? 0) > 0 && project.installerId) {
    return "INSTALLATION";
  }

  return STATUS_TO_STEP[project.status] ?? "STUDY";
}

/** Steps before the current one are marked completed in the stepper. */
export function getProjectCompletedSteps(project: ProjectResponse): ProjectStep[] {
  if (project.status === "COMPLETED") {
    return [...STEP_ORDER];
  }

  const current = getProjectCurrentStep(project);
  const currentIdx = STEP_ORDER.indexOf(current);
  if (currentIdx <= 0) return [];
  return STEP_ORDER.slice(0, currentIdx);
}
