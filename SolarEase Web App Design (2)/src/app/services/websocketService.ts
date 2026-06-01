import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:8080/ws";

let stompClient: Client | null = null;
/** Subscriptions created after STOMP CONNECTED — cleared on disconnect */
let stompSubscriptions: StompSubscription[] = [];

let notificationUserId: string | null = null;
let notificationHandler: ((n: NotificationPayload) => void) | null = null;
let clientCountsHandler: ((p: { clientId: number | string; projectCount: number }) => void) | null = null;
let adminDemandsHandler: ((event: AdminDemandEvent) => void) | null = null;

/** Map of projectId → per-project message handlers */
const projectMessageHandlers = new Map<number, (msg: MessagePayload) => void>();

function clearStompSubscriptions(): void {
  stompSubscriptions.forEach((sub) => {
    try {
      sub.unsubscribe();
    } catch {
      /* ignore */
    }
  });
  stompSubscriptions = [];
}

function attachNotificationSubscriptions(): void {
  if (!stompClient?.connected) {
    return;
  }
  clearStompSubscriptions();

  if (notificationUserId && notificationHandler) {
    const handler = notificationHandler;
    const userId = notificationUserId;
    const onFrame = (msg: IMessage) => {
      try {
        handler(JSON.parse(msg.body));
      } catch {
        /* ignore malformed payloads */
      }
    };
    stompSubscriptions.push(
      stompClient.subscribe(`/user/${userId}/queue/notifications`, onFrame)
    );
    stompSubscriptions.push(
      stompClient.subscribe(`/topic/notifications/${userId}`, onFrame)
    );
  }

  // subscribe to client project counts if handler is registered
  if (clientCountsHandler) {
    const onCounts = (msg: IMessage) => {
      try {
        if (clientCountsHandler) clientCountsHandler(JSON.parse(msg.body));
      } catch {
        /* ignore */
      }
    };
    stompSubscriptions.push(stompClient.subscribe(`/topic/client-project-counts`, onCounts));
  }

  // subscribe to the admin demands broadcast topic if a handler is registered
  if (adminDemandsHandler) {
    const onDemand = (msg: IMessage) => {
      try {
        if (adminDemandsHandler) adminDemandsHandler(JSON.parse(msg.body));
      } catch {
        /* ignore malformed payloads */
      }
    };
    stompSubscriptions.push(stompClient.subscribe(`/topic/admin/demands`, onDemand));
  }

  // subscribe to per-project message topics
  projectMessageHandlers.forEach((msgHandler, projectId) => {
    const onMsg = (msg: IMessage) => {
      try {
        msgHandler(JSON.parse(msg.body));
      } catch {
        /* ignore */
      }
    };
    stompSubscriptions.push(
      stompClient!.subscribe(`/topic/project-messages/${projectId}`, onMsg)
    );
  });
}

export function connectWebSocket(
  userId: string,
  token: string,
  options?: { onConnected?: () => void }
): void {
  const onConnected = options?.onConnected;

  if (stompClient?.active) {
    if (stompClient.connected) {
      attachNotificationSubscriptions();
      onConnected?.();
    }
    return;
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL) as unknown as WebSocket,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
      "user-id": userId,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      console.debug("[WS] Connected to SolarEase WebSocket");
      attachNotificationSubscriptions();
      onConnected?.();
    },
    onDisconnect: () => {
      console.debug("[WS] Disconnected from SolarEase WebSocket");
      clearStompSubscriptions();
    },
    onStompError: (frame) => {
      console.error("[WS] STOMP error:", frame.headers.message);
    },
  });

  stompClient.activate();
}

export function disconnectWebSocket(): void {
  clearStompSubscriptions();
  notificationUserId = null;
  notificationHandler = null;
  clientCountsHandler = null;
  adminDemandsHandler = null;
  projectMessageHandlers.clear();
  if (stompClient?.active) {
    stompClient.deactivate();
  }
  stompClient = null;
}

/**
 * Register notification handler. Subscriptions are created only after STOMP is connected
 * (in onConnect). Call before or after connectWebSocket — both orders work.
 */
export function subscribeToNotifications(
  userId: string,
  onMessage: (notification: NotificationPayload) => void
): void {
  notificationUserId = userId;
  notificationHandler = onMessage;
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

/**
 * Subscribe to client project count updates published on /topic/client-project-counts
 */
export function subscribeToClientProjectCounts(
  onMessage: (payload: { clientId: number | string; projectCount: number }) => void
): void {
  clientCountsHandler = onMessage;
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

/**
 * Subscribe to the admin demands broadcast topic. Only useful when the current
 * user is an admin -- callers must guard on role themselves.
 */
export function subscribeToAdminDemands(
  onMessage: (event: AdminDemandEvent) => void
): void {
  adminDemandsHandler = onMessage;
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function unsubscribeFromAdminDemands(): void {
  adminDemandsHandler = null;
}

export function isConnected(): boolean {
  return Boolean(stompClient?.connected);
}

/**
 * Subscribe to real-time messages for a specific project.
 * Call unsubscribeFromProjectMessages when leaving the page.
 */
export function subscribeToProjectMessages(
  projectId: number,
  onMessage: (msg: MessagePayload) => void
): void {
  projectMessageHandlers.set(projectId, onMessage);
  if (stompClient?.connected) {
    const onMsg = (msg: IMessage) => {
      try {
        onMessage(JSON.parse(msg.body));
      } catch {
        /* ignore */
      }
    };
    const sub = stompClient.subscribe(`/topic/project-messages/${projectId}`, onMsg);
    stompSubscriptions.push(sub);
  }
}

/** Remove the real-time message subscription for a project. */
export function unsubscribeFromProjectMessages(projectId: number): void {
  projectMessageHandlers.delete(projectId);
}

export interface NotificationPayload {
  id: string | number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  recipientRoles?: string[];
  content: string;
  timestamp: string;
}

/** Event broadcast on /topic/admin/demands when a new demand is created. */
export interface AdminDemandEvent {
  event: "DEMAND_CREATED" | string;
  notificationId: number;
  demandId: number;
  name: string;
  status: "NOUVELLE" | "A_COMPLETER" | "VALIDEE" | "REJETEE" | string;
  source: "PUBLIC" | "CLIENT" | string;
  priority: "HAUTE" | "NORMALE" | "BASSE" | string;
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  createdAt: string;
}
