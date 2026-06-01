import { useEffect, useRef } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToNotifications,
} from "../services/websocketService";

interface UseLiveRefreshOptions {
  userId?: string | null;
  token?: string | null;
  enabled?: boolean;
  intervalMs?: number;
  onRefresh: () => Promise<void> | void;
  onConnected?: () => void;
}

export function useLiveRefresh({
  userId,
  token,
  enabled = true,
  intervalMs = 15000,
  onRefresh,
  onConnected,
}: UseLiveRefreshOptions): void {
  const onRefreshRef = useRef(onRefresh);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Initial load immediately
  useEffect(() => {
    if (!enabled) return;
    void onRefreshRef.current();
  }, [enabled]);

  // Polling with optimized interval
  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const runRefresh = async () => {
      if (!active) return;
      try {
        await onRefreshRef.current();
      } catch (error) {
        console.error("Live refresh failed:", error);
      }
    };

    // Set up polling
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
    intervalIdRef.current = setInterval(runRefresh, intervalMs);

    return () => {
      active = false;
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, intervalMs]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!enabled || !userId || !token) return;

    subscribeToNotifications(userId, () => {
      void onRefreshRef.current();
    });

    connectWebSocket(userId, token, {
      onConnected: () => {
        console.log("[useLiveRefresh] WebSocket connected");
        onConnected?.();
      },
    });

    return () => {
      disconnectWebSocket();
    };
  }, [enabled, userId, token, onConnected]);
}
