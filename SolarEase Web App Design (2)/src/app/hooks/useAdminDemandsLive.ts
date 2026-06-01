import { useEffect, useRef } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToAdminDemands,
  unsubscribeFromAdminDemands,
  isConnected,
  AdminDemandEvent,
} from "../services/websocketService";

interface UseAdminDemandsLiveOptions {
  /** identity-service UUID of the current user (must have role ADMIN) */
  userId: string | null;
  /** Bearer token */
  token: string | null;
  /** Set to false to skip the subscription (e.g. user is not admin yet) */
  enabled?: boolean;
  /** Called every time a new demand event is received from the broker. */
  onEvent: (event: AdminDemandEvent) => void;
}

/**
 * Subscribe the current admin session to /topic/admin/demands. The hook keeps
 * the STOMP client alive (reusing any existing connection from useNotifications)
 * and routes incoming events to the supplied callback.
 *
 * The callback identity can change between renders without re-subscribing -- the
 * latest reference is always invoked.
 */
export function useAdminDemandsLive({
  userId,
  token,
  enabled = true,
  onEvent,
}: UseAdminDemandsLiveOptions): void {
  const handlerRef = useRef(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !userId || !token) return;

    subscribeToAdminDemands((event) => {
      try {
        handlerRef.current?.(event);
      } catch (err) {
        // never let a bad payload crash the live stream
        // eslint-disable-next-line no-console
        console.warn("[useAdminDemandsLive] handler failed:", err);
      }
    });

    if (!isConnected()) {
      connectWebSocket(userId, token);
    }

    return () => {
      unsubscribeFromAdminDemands();
      // Note: we intentionally do NOT call disconnectWebSocket() here -- other
      // hooks (useNotifications, project messages, ...) share the same client.
    };
    // We deliberately exclude onEvent from deps -- the ref keeps it fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, token]);
}

// Re-export so consumers don't need to import from two places.
export type { AdminDemandEvent };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepDisconnectReachable = disconnectWebSocket;
