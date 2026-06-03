import api from "./api";

export interface ProjectRequest {
  name: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  peakPower: number;
  availableArea?: number;
  inclination?: number;
  orientation?: number;
  budget?: number;
  clientId?: number;
  installerId?: string;
  installerEmail?: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  peakPower: number;
  availableArea: number;
  inclination: number;
  orientation: number;
  budget: number;
  status: "CREATED" | "EN_PREPARATION" | "INSTALLATEUR_AFFECTE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  installerId: string;
  installerEmail?: string;
  assignedByAdminId?: string;
  assignedByAdminEmail?: string;
  currentProgress?: number;
  currentFieldStatus?: string;
  currentPhase?: string;
  currentPhaseLabel?: string;
  client?: { id: number; firstName: string; lastName: string };
  invitationSent?: boolean;
  invitationMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalClients: number;
  projectsCreated: number;
  projectsInProgress: number;
  projectsCompleted: number;
  projectsCancelled: number;
  /** Admin-only: count of demands still in NOUVELLE state */
  pendingDemandsCount?: number;
  /** Admin-only: demands created today (start of local day) */
  newDemandsTodayCount?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

const projectService = {
  getProjects: (params?: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) =>
    api
      .get<Page<ProjectResponse>>("/projects", { params })
      .then((r) => r.data),

  getProject: (id: number) =>
    api.get<ProjectResponse>(`/projects/${id}`).then((r) => r.data),

  createProject: (data: ProjectRequest) =>
    api.post<ProjectResponse>("/projects", data).then((r) => r.data),

  updateProject: (id: number, data: ProjectRequest) =>
    api.put<ProjectResponse>(`/projects/${id}`, data).then((r) => r.data),

  deleteProject: (id: number) =>
    api.delete(`/projects/${id}`).then((r) => r.data),

  getDashboardStats: () =>
    api.get<DashboardStats>("/projects/dashboard/stats").then((r) => r.data),

  getProjectsByClientId: (clientId: number) =>
    api.get<ProjectResponse[]>(`/projects/client/${clientId}`).then((r) => r.data),

  getMyProjects: () =>
    api.get<ProjectResponse[]>("/projects/my").then((r) => r.data),

  createAdminProject: (data: ProjectRequest & { installerId: string }) =>
    api.post<ProjectResponse>("/projects/admin/assign", data).then((r) => r.data),

  getAllProjects: (params?: { status?: string; page?: number; size?: number }) =>
    api.get<Page<ProjectResponse>>("/projects/all", { params }).then((r) => r.data),

  updateProjectStatus: (id: number, status: string) =>
    api.patch<ProjectResponse>(`/projects/${id}/status?status=${status}`).then((r) => r.data),
};

export default projectService;
