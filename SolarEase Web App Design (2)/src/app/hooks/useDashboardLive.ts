import { useEffect, useRef } from "react";
import {
  connectWebSocket,
  releaseWebSocketConnection,
  subscribeToAdminDashboard,
  subscribeToInstallerDashboard,
  unsubscribeFromAdminDashboard,
  unsubscribeFromInstallerDashboard,
  isConnected,
} from "../services/websocketService";

interface UseDashboardLiveOptions {
  userId: string | null;
  token: string | null;
  isAdmin: boolean;
  enabled?: boolean;
  onRefresh: () => Promise<void> | void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

/**
 * Subscribes the dashboard to STOMP refresh events:
 * - Admin  → /topic/admin/dashboard
 * - Installer → /topic/installer/{userId}/dashboard
 */
export function useDashboardLive({
  userId,
  token,
  isAdmin,
  enabled = true,
  onRefresh,
  onConnected,
  onDisconnected,
}: UseDashboardLiveOptions): void {
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled || !userId || !token) return;

    const handleEvent = () => {
      void refreshRef.current?.();
    };

    if (isAdmin) {
      subscribeToAdminDashboard(handleEvent);
    } else {
      subscribeToInstallerDashboard(userId, handleEvent);
    }

    connectWebSocket(userId, token, {
      onConnected: () => {
        onConnected?.();
      },
    });

    if (isConnected()) {
      onConnected?.();
    }

    return () => {
      if (isAdmin) {
        unsubscribeFromAdminDashboard();
      } else {
        unsubscribeFromInstallerDashboard();
      }
      releaseWebSocketConnection();
      if (!isConnected()) {
        onDisconnected?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, token, isAdmin]);
}
