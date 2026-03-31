import api from "./api";
import { Page } from "./projectService";

export interface ClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface ClientResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  installerId: string;
  createdAt: string;
  updatedAt: string;
}

const clientService = {
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

  createClient: (data: ClientRequest) =>
    api.post<ClientResponse>("/clients", data).then((r) => r.data),

  updateClient: (id: number, data: ClientRequest) =>
    api.put<ClientResponse>(`/clients/${id}`, data).then((r) => r.data),

  deleteClient: (id: number) =>
    api.delete(`/clients/${id}`).then((r) => r.data),
};

export default clientService;
