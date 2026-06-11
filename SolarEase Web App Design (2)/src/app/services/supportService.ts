import api from "./api";

export type SupportTicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type SupportTicketPriority = "LOW" | "NORMAL" | "HIGH";

export interface SupportTicket {
  id: number;
  clientUserId?: string;
  clientName?: string;
  clientEmail?: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface CreateSupportTicketRequest {
  subject: string;
  description: string;
  priority?: SupportTicketPriority;
}

const supportService = {
  getMyTickets: () =>
    api.get<SupportTicket[]>("/support/tickets").then((r) => r.data),

  getTicket: (id: number) =>
    api.get<SupportTicket>(`/support/tickets/${id}`).then((r) => r.data),

  createTicket: (data: CreateSupportTicketRequest) =>
    api.post<SupportTicket>("/support/tickets", data).then((r) => r.data),

  getAllTicketsAdmin: () =>
    api.get<SupportTicket[]>("/support/tickets/admin/all").then((r) => r.data),

  getOpenCountAdmin: () =>
    api.get<{ open: number }>("/support/tickets/admin/open-count").then((r) => r.data.open),

  getTicketAdmin: (id: number) =>
    api.get<SupportTicket>(`/support/tickets/admin/${id}`).then((r) => r.data),

  updateTicketStatusAdmin: (id: number, status: SupportTicketStatus) =>
    api
      .patch<SupportTicket>(`/support/tickets/admin/${id}/status`, { status })
      .then((r) => r.data),
};

export default supportService;
