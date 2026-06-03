import api from "./api";

export type DemandStatus = "NOUVELLE" | "A_COMPLETER" | "VALIDEE" | "REJETEE";
export type DemandSource = "PUBLIC" | "CLIENT";
export type DemandPriority = "HAUTE" | "NORMALE" | "BASSE";

export interface Demand {
  id: number;
  clientUserId: string;
  clientEmail: string;
  clientFirstName: string;
  clientLastName: string;
  clientPhone?: string;
  status: DemandStatus;
  source: DemandSource;
  priority: DemandPriority;
  assignedAdminId?: string | null;
  name: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  peakPower?: number;
  availableArea?: number;
  inclination?: number;
  orientation?: number;
  budget?: number;
  rejectionReason?: string;
  adminNote?: string;
  projectId?: number;
  clientHasAccount?: boolean;
  invitationSent?: boolean;
  invitationSentAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Alias kept for compatibility with older code paths. */
  phone?: string;
}

export interface DemandPage {
  content: Demand[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DemandCreateRequest {
  name: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  peakPower?: number;
  availableArea?: number;
  inclination?: number;
  orientation?: number;
  budget?: number;
}

export interface PublicDemandCreateRequest {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface DemandSearchParams {
  page?: number;
  size?: number;
  status?: DemandStatus;
  source?: DemandSource;
  q?: string;
}

export const STATUS_LABELS: Record<DemandStatus, { label: string; color: string; bg: string; ring: string }> = {
  NOUVELLE:    { label: "Nouvelle",    color: "text-blue-700",   bg: "bg-blue-100",   ring: "ring-blue-200" },
  A_COMPLETER: { label: "À compléter", color: "text-orange-700", bg: "bg-orange-100", ring: "ring-orange-200" },
  VALIDEE:     { label: "Validée",     color: "text-green-700",  bg: "bg-green-100",  ring: "ring-green-200" },
  REJETEE:     { label: "Rejetée",     color: "text-red-700",    bg: "bg-red-100",    ring: "ring-red-200" },
};

export const SOURCE_LABELS: Record<DemandSource, { label: string; short: string; color: string; bg: string }> = {
  PUBLIC: { label: "Formulaire public", short: "Public",  color: "text-purple-700", bg: "bg-purple-100" },
  CLIENT: { label: "Portail client",    short: "Portail", color: "text-slate-700",  bg: "bg-slate-100" },
};

export const PRIORITY_LABELS: Record<DemandPriority, { label: string; color: string; bg: string }> = {
  HAUTE:   { label: "Haute",   color: "text-red-700",    bg: "bg-red-50" },
  NORMALE: { label: "Normale", color: "text-slate-600",  bg: "bg-slate-50" },
  BASSE:   { label: "Basse",   color: "text-emerald-700", bg: "bg-emerald-50" },
};

const demandService = {
  /** CLIENT: submit a new request */
  createDemand: async (data: DemandCreateRequest): Promise<Demand> => {
    const res = await api.post<Demand>("/demands", data);
    return res.data;
  },

  /** PUBLIC: submit a demand from the public contact page */
  createPublicDemand: async (data: PublicDemandCreateRequest): Promise<Demand> => {
    const res = await api.post<Demand>("/demands/public", data);
    return res.data;
  },

  /** CLIENT: list my demands */
  getMyDemands: async (page = 0, size = 10): Promise<DemandPage> => {
    const res = await api.get<DemandPage>(`/demands/my?page=${page}&size=${size}`);
    return res.data;
  },

  /** ADMIN: search/list demands with optional filters */
  getAllDemands: async (
    pageOrParams: number | DemandSearchParams = 0,
    size = 25,
    status?: DemandStatus
  ): Promise<DemandPage> => {
    // Back-compat: original signature was getAllDemands(page, size, status)
    const params: DemandSearchParams =
      typeof pageOrParams === "number"
        ? { page: pageOrParams, size, status }
        : pageOrParams;

    const search = new URLSearchParams();
    search.set("page", String(params.page ?? 0));
    search.set("size", String(params.size ?? 25));
    if (params.status) search.set("status", params.status);
    if (params.source) search.set("source", params.source);
    if (params.q && params.q.trim()) search.set("q", params.q.trim());

    const res = await api.get<DemandPage>(`/demands?${search.toString()}`);
    return res.data;
  },

  /** ADMIN or owner: fetch one demand */
  getDemand: async (id: number): Promise<Demand> => {
    const res = await api.get<Demand>(`/demands/${id}`);
    return res.data;
  },

  /** ADMIN: update demand status */
  updateStatus: async (
    id: number,
    status: DemandStatus,
    adminNote?: string,
    rejectionReason?: string
  ): Promise<Demand> => {
    const res = await api.patch<Demand>(`/demands/${id}/status`, {
      status,
      adminNote,
      rejectionReason,
    });
    return res.data;
  },

  /** ADMIN: assign to a specific admin, or to the caller when adminId is omitted */
  assign: async (id: number, adminId?: string): Promise<Demand> => {
    const res = await api.patch<Demand>(`/demands/${id}/assign`, adminId ? { adminId } : {});
    return res.data;
  },

  /** ADMIN: change priority */
  updatePriority: async (id: number, priority: DemandPriority): Promise<Demand> => {
    const res = await api.patch<Demand>(`/demands/${id}/priority`, { priority });
    return res.data;
  },

  /** ADMIN: convert demand to project (existing client) */
  convertToProject: async (
    id: number,
    clientId: number,
    coordinates?: { latitude?: number; longitude?: number }
  ): Promise<{ id: number }> => {
    const res = await api.post<{ id: number }>(`/demands/${id}/convert-to-project`, {
      clientId,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
    });
    return res.data;
  },

  /** ADMIN: promote a PUBLIC demand into a client + project in one shot */
  promotePublicAndConvert: async (
    id: number,
    coordinates?: { latitude?: number; longitude?: number }
  ): Promise<{ id: number }> => {
    const res = await api.post<{ id: number }>(
      `/demands/${id}/promote-public-to-client`,
      {
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      }
    );
    return res.data;
  },

  /** ADMIN: send client invitation by email and/or SMS */
  sendInvitation: async (
    id: number,
    clientEmail: string,
    clientName: string,
    projectId: number | null,
    phoneNumber?: string,
    message?: string,
    sendEmail: boolean = true,
    sendSms: boolean = true
  ): Promise<{ success: string; message: string }> => {
    const res = await api.post<{ success: string; message: string }>(`/demands/${id}/send-invitation`, {
      demandId: id,
      projectId,
      clientEmail,
      clientName,
      phoneNumber,
      message,
      sendEmail,
      sendSms,
    });
    return res.data;
  },
};

export default demandService;
