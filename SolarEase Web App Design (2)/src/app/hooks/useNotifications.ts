import { useEffect, useState, useCallback, useRef } from "react";
import {
  connectWebSocket,
  releaseWebSocketConnection,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  NotificationPayload,
} from "../services/websocketService";
import notificationService from "../services/notificationService";

interface UseNotificationsOptions {
  userId: string | null;
  token: string | null;
}

interface UseNotificationsResult {
  notifications: NotificationPayload[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  isConnected: boolean;
}

export function useNotifications({
  userId,
  token,
}: UseNotificationsOptions): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    notificationService
      .getNotifications(userId)
      .then((data) =>
        setNotifications(
          data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            read: n.read,
            createdAt: n.createdAt,
          }))
        )
      )
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId || !token) return;

    const handler = (payload: NotificationPayload) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => String(n.id) === String(payload.id));
        if (exists) return prev;
        return [payload, ...prev];
      });
    };

    subscribeToNotifications(userId, handler);

    connectWebSocket(userId, token, {
      onConnected: () => setWsConnected(true),
    });

    return () => {
      unsubscribeFromNotifications(handler);
      releaseWebSocketConnection();
      setWsConnected(false);
    };
  }, [userId, token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      await notificationService.markNotificationRead(userId, id);
      setNotifications((prev) =>
        prev.map((n) => (String(n.id) === id ? { ...n, read: true } : n))
      );
    },
    [userId]
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await Promise.allSettled(
      notifications
        .filter((n) => !n.read)
        .map((n) => notificationService.markNotificationRead(userId, String(n.id)))
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [userId, notifications]);

  return {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    isConnected: wsConnected,
  };
}
