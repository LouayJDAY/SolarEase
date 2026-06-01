import api from "./api";

export type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

const clientBase = "/clients";
const base = "/notifications";

export const getNotifications = async (clientId: string): Promise<Notification[]> => {
  try {
    const res = await api.get<Notification[]>(base);
    return res.data;
  } catch {
    const res = await api.get<Notification[]>(`${clientBase}/${clientId}/notifications`);
    return res.data;
  }
};

export const markNotificationRead = async (clientId: string, id: string): Promise<void> => {
  try {
    await api.post(`${base}/${id}/read`);
  } catch {
    await api.post(`${clientBase}/${clientId}/notifications/${id}/read`);
  }
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.post(`${base}/read-all`);
};

export const getUnreadCount = async (): Promise<number> => {
  const res = await api.get<number>(`${base}/unread-count`);
  return res.data;
};

export default { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount };
