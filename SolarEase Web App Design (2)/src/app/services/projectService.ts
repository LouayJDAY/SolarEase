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
  status: "CREATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  installerId: string;
  client?: { id: number; firstName: string; lastName: string };
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
};

export default projectService;
