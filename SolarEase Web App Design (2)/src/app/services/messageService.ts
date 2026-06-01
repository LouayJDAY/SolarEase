import api from "./api";

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  recipientRoles?: string[];
  content: string;
  timestamp: string;
};

export type Conversation = {
  id: string;
  projectId?: number;
  participants: string[];
  messages: Message[];
};

const base = "/clients";
const projectBase = "/projects";

export const getConversations = async (clientId: string) => {
  const res = await api.get<Conversation[]>(`${base}/${clientId}/messages`);
  return res.data;
};

export const sendMessage = async (clientId: string, conversationId: string, payload: Partial<Message>) => {
  const res = await api.post<Message>(`${base}/${clientId}/messages/${conversationId}`, payload);
  return res.data;
};

export const getProjectConversations = async (projectId: number) => {
  const res = await api.get<Conversation[]>(`${projectBase}/${projectId}/messages`);
  return res.data;
};

export const sendProjectMessage = async (
  projectId: number,
  payload: Omit<Partial<Message>, "conversationId">
) => {
  const res = await api.post<Message>(`${projectBase}/${projectId}/messages`, payload);
  return res.data;
};

export default { getConversations, sendMessage, getProjectConversations, sendProjectMessage };
