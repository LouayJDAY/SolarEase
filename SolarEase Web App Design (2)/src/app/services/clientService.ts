import api from "./api";
import { Page } from "./projectService";

export interface ClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  clientType?: string;
  notes?: string;
}

export interface ClientResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  address: string;
  city?: string;
  postalCode?: string;
  clientType?: string;
  notes?: string;
  installerId: string;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
  projectCount?: number;
}

export interface ClientStats {
  totalClients: number;
  totalProjectsLinked: number;
  addedThisMonth: number;
}

export interface ClientUserDto {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
}

export interface ClientMeUpdateRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
}

function toPayload(data: ClientRequest) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phoneNumber: data.phoneNumber ?? data.phone,
    address: data.address,
    city: data.city,
    postalCode: data.postalCode,
    clientType: data.clientType,
    notes: data.notes,
  };
}

const clientService = {
  getClientStats: () =>
    api.get<ClientStats>("/clients/stats").then((r) => r.data),

  getClientUsers: () =>
    api.get<ClientUserDto[]>("/auth/clients").then((r) => r.data),

  getClients: (params?: {
    search?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) =>
    api
      .get<Page<ClientResponse>>("/clients", { params })
      .then((r) => r.data),

  getClient: (id: number) =>
    api.get<ClientResponse>(`/clients/${id}`).then((r) => r.data),

  getMyClientProfile: () =>
    api.get<ClientResponse>("/clients/me").then((r) => r.data),

  updateMyClientProfile: (data: ClientMeUpdateRequest) =>
    api.put<ClientResponse>("/clients/me", data).then((r) => r.data),

  createClient: (data: ClientRequest) =>
    api.post<ClientResponse>("/clients", toPayload(data)).then((r) => r.data),

  updateClient: (id: number, data: ClientRequest) =>
    api.put<ClientResponse>(`/clients/${id}`, toPayload(data)).then((r) => r.data),

  deleteClient: (id: number) =>
    api.delete(`/clients/${id}`).then((r) => r.data),
};

export default clientService;
