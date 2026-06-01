import api from "./api";
import type { BlockageImpactKey, BlockageTypeKey } from "../constants/installationPhases";

export type InstallerFieldStatus =
  | "EN_DEPLACEMENT"
  | "SUR_SITE"
  | "EN_INSTALLATION"
  | "EN_PAUSE"
  | "FIN_CHANTIER"
  | "BLOCAGE";

export const FIELD_STATUS_LABELS: Record<InstallerFieldStatus, string> = {
  EN_DEPLACEMENT:  "En déplacement",
  SUR_SITE:        "Sur site",
  EN_INSTALLATION: "En installation",
  EN_PAUSE:        "En pause",
  FIN_CHANTIER:    "Fin de chantier",
  BLOCAGE:         "Blocage",
};

export const FIELD_STATUS_COLORS: Record<InstallerFieldStatus, string> = {
  EN_DEPLACEMENT:  "bg-blue-100 text-blue-700",
  SUR_SITE:        "bg-indigo-100 text-indigo-700",
  EN_INSTALLATION: "bg-green-100 text-green-700",
  EN_PAUSE:        "bg-yellow-100 text-yellow-700",
  FIN_CHANTIER:    "bg-emerald-100 text-emerald-700",
  BLOCAGE:         "bg-red-100 text-red-700",
};

export interface FieldUpdate {
  id: number;
  projectId: number;
  installerId: string;
  installerEmail?: string;
  fieldStatus: InstallerFieldStatus;
  progressPercent: number;
  note?: string;
  isBlockage: boolean;
  blockageReason?: string;
  requiresAdminValidation: boolean;
  adminValidated?: boolean | null;
  adminNote?: string;
  validatedByAdminId?: string;
  validatedByAdminEmail?: string;
  validatedAt?: string;
  createdAt: string;

  completedSteps?: string[] | null;
  currentPhase?: string | null;
  currentPhaseLabel?: string | null;
  blockageType?: BlockageTypeKey | null;
  blockageTypeLabel?: string | null;
  blockageImpact?: BlockageImpactKey | null;
  blockageImpactLabel?: string | null;
  photoUrl?: string | null;
}

export interface FieldUpdateCreateRequest {
  fieldStatus: InstallerFieldStatus;
  /**
   * Optional manual override. When `completedSteps` is set the backend
   * computes the percentage from the checklist and ignores this value.
   */
  progressPercent?: number;
  note?: string;
  isBlockage?: boolean;
  blockageReason?: string;
  requiresAdminValidation?: boolean;
  completedSteps?: string[];
  blockageType?: BlockageTypeKey;
  blockageImpact?: BlockageImpactKey;
  photoUrl?: string;
}

const fieldUpdateService = {
  createFieldUpdate: (projectId: number, data: FieldUpdateCreateRequest) =>
    api
      .post<FieldUpdate>(`/projects/${projectId}/field-updates`, data)
      .then((r) => r.data),

  getFieldUpdates: (projectId: number) =>
    api
      .get<FieldUpdate[]>(`/projects/${projectId}/field-updates`)
      .then((r) => r.data),

  getLatestFieldUpdate: (projectId: number) =>
    api
      .get<FieldUpdate | null>(`/projects/${projectId}/field-updates/latest`)
      .then((r) => r.data)
      .catch(() => null),

  validateFieldUpdate: (
    projectId: number,
    updateId: number,
    validated: boolean,
    adminNote?: string
  ) =>
    api
      .patch<FieldUpdate>(
        `/projects/${projectId}/field-updates/${updateId}/validate`,
        { validated: String(validated), adminNote }
      )
      .then((r) => r.data),
};

export default fieldUpdateService;
