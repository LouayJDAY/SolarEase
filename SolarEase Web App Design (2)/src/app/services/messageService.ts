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
  attachmentFileName?: string;
  attachmentOriginalName?: string;
  attachmentContentType?: string;
  attachmentSizeBytes?: number;
  attachmentUrl?: string;
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

export const sendMessageWithAttachment = async (
  clientId: string,
  conversationId: string,
  payload: {
    content: string;
    senderId?: string;
    senderName?: string;
    senderRole?: string;
    projectId?: number;
  },
  file: File
) => {
  const form = new FormData();
  form.append("content", payload.content);
  if (payload.senderId) form.append("senderId", payload.senderId);
  if (payload.senderName) form.append("senderName", payload.senderName);
  form.append("file", file);

  const params = payload.projectId != null ? { projectId: payload.projectId } : undefined;
  const res = await api.post<Message>(
    `${base}/${clientId}/messages/${conversationId}/with-attachment`,
    form,
    { params }
  );
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

export const sendProjectMessageWithAttachment = async (
  projectId: number,
  payload: {
    content: string;
    senderId?: string;
    senderName?: string;
    senderRole?: string;
    recipientRoles?: string[];
  },
  file: File
) => {
  const form = new FormData();
  form.append("content", payload.content);
  if (payload.senderId) form.append("senderId", payload.senderId);
  if (payload.senderName) form.append("senderName", payload.senderName);
  if (payload.recipientRoles?.length) {
    form.append("recipientRoles", payload.recipientRoles.join(","));
  }
  form.append("file", file);

  const res = await api.post<Message>(
    `${projectBase}/${projectId}/messages/with-attachment`,
    form
  );
  return res.data;
};

export async function downloadMessageAttachment(
  attachmentUrl: string,
  filename: string,
  asDownload = true
): Promise<void> {
  const path = attachmentUrl.startsWith("/api") ? attachmentUrl.slice(4) : attachmentUrl;
  const res = await api.get(path, {
    params: { attachment: asDownload },
    responseType: "blob",
  });
  const blob = res.data as Blob;
  const url = window.URL.createObjectURL(blob);
  if (asDownload) {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  }
}

export function formatAttachmentSize(bytes?: number): string {
  if (bytes == null || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function messageToAttachments(message: Message) {
  if (!message.attachmentUrl) return undefined;
  return [
    {
      name: message.attachmentOriginalName ?? "Fichier joint",
      size: formatAttachmentSize(message.attachmentSizeBytes),
      url: message.attachmentUrl,
      contentType: message.attachmentContentType,
    },
  ];
}

export default {
  getConversations,
  sendMessage,
  sendMessageWithAttachment,
  getProjectConversations,
  sendProjectMessage,
  sendProjectMessageWithAttachment,
  downloadMessageAttachment,
  formatAttachmentSize,
  messageToAttachments,
};
