import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL =
  import.meta.env.VITE_WS_URL ??
  `${window.location.origin}/ws`;

/**
 * Vercel rewrites proxy HTTP to Azure but do not upgrade WebSocket (wss).
 * Use xhr polling/streaming only unless VITE_WS_URL points to a wss-capable backend.
 */
const SOCKJS_OPTIONS: { transports: string[] } | undefined =
  import.meta.env.VITE_WS_URL
    ? undefined
    : { transports: ["xhr-streaming", "xhr-polling"] };

function createSockJsSocket(): WebSocket {
  return new SockJS(WS_URL, undefined, SOCKJS_OPTIONS) as unknown as WebSocket;
}

let stompClient: Client | null = null;
/** Subscriptions created after STOMP CONNECTED — cleared on disconnect */
let stompSubscriptions: StompSubscription[] = [];

/** Shared STOMP client: multiple hooks acquire/release instead of hard disconnect. */
let connectionRefCount = 0;

let notificationUserId: string | null = null;
const notificationHandlers = new Set<(n: NotificationPayload) => void>();
let clientCountsHandler: ((p: { clientId: number | string; projectCount: number }) => void) | null = null;
let adminDemandsHandler: ((event: AdminDemandEvent) => void) | null = null;
let adminDashboardHandler: ((event: DashboardRefreshEvent) => void) | null = null;
let installerDashboardHandler: ((event: DashboardRefreshEvent) => void) | null = null;
let installerDashboardUserId: string | null = null;

/** Map of projectId → per-project message handlers */
const projectMessageHandlers = new Map<number, (msg: MessagePayload) => void>();
const fieldUpdateHandlers = new Map<number, (update: FieldUpdatePayload) => void>();
const projectUpdateHandlers = new Map<number, (event: ProjectLiveUpdateEvent) => void>();

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

  if (notificationUserId && notificationHandlers.size > 0) {
    const userId = notificationUserId;
    const onFrame = (msg: IMessage) => {
      try {
        const payload = JSON.parse(msg.body) as NotificationPayload;
        notificationHandlers.forEach((handler) => handler(payload));
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

  if (adminDashboardHandler) {
    const onDashboard = (msg: IMessage) => {
      try {
        if (adminDashboardHandler) adminDashboardHandler(JSON.parse(msg.body));
      } catch {
        /* ignore malformed payloads */
      }
    };
    stompSubscriptions.push(stompClient.subscribe(`/topic/admin/dashboard`, onDashboard));
  }

  if (installerDashboardHandler && installerDashboardUserId) {
    const handler = installerDashboardHandler;
    const onInstallerDashboard = (msg: IMessage) => {
      try {
        handler(JSON.parse(msg.body));
      } catch {
        /* ignore malformed payloads */
      }
    };
    stompSubscriptions.push(
      stompClient.subscribe(
        `/topic/installer/${installerDashboardUserId}/dashboard`,
        onInstallerDashboard
      )
    );
  }

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

  fieldUpdateHandlers.forEach((handler, projectId) => {
    const onUpdate = (msg: IMessage) => {
      try {
        handler(JSON.parse(msg.body));
      } catch {
        /* ignore */
      }
    };
    stompSubscriptions.push(
      stompClient!.subscribe(`/topic/field-updates/${projectId}`, onUpdate)
    );
  });

  projectUpdateHandlers.forEach((handler, projectId) => {
    const onUpdate = (msg: IMessage) => {
      try {
        handler(JSON.parse(msg.body));
      } catch {
        /* ignore */
      }
    };
    stompSubscriptions.push(
      stompClient!.subscribe(`/topic/project-updates/${projectId}`, onUpdate)
    );
  });
}

export function connectWebSocket(
  userId: string,
  token: string,
  options?: { onConnected?: () => void }
): void {
  connectionRefCount++;
  const onConnected = options?.onConnected;

  if (stompClient?.active) {
    if (stompClient.connected) {
      attachNotificationSubscriptions();
      onConnected?.();
    }
    return;
  }

  stompClient = new Client({
    webSocketFactory: () => createSockJsSocket(),
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

/**
 * Release a shared WebSocket consumer. The connection is torn down only when
 * no hook still holds a reference (ref count reaches zero).
 */
export function releaseWebSocketConnection(): void {
  connectionRefCount = Math.max(0, connectionRefCount - 1);
  if (connectionRefCount === 0) {
    disconnectWebSocket();
  }
}

export function disconnectWebSocket(): void {
  connectionRefCount = 0;
  clearStompSubscriptions();
  notificationUserId = null;
  notificationHandlers.clear();
  clientCountsHandler = null;
  adminDemandsHandler = null;
  adminDashboardHandler = null;
  installerDashboardHandler = null;
  installerDashboardUserId = null;
  projectMessageHandlers.clear();
  fieldUpdateHandlers.clear();
  projectUpdateHandlers.clear();
  if (stompClient?.active) {
    stompClient.deactivate();
  }
  stompClient = null;
}

export function subscribeToNotifications(
  userId: string,
  onMessage: (notification: NotificationPayload) => void
): void {
  notificationUserId = userId;
  notificationHandlers.add(onMessage);
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function unsubscribeFromNotifications(
  onMessage?: (notification: NotificationPayload) => void
): void {
  if (onMessage) {
    notificationHandlers.delete(onMessage);
  } else {
    notificationHandlers.clear();
  }
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function subscribeToClientProjectCounts(
  onMessage: (payload: { clientId: number | string; projectCount: number }) => void
): void {
  clientCountsHandler = onMessage;
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

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
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function subscribeToAdminDashboard(
  onMessage: (event: DashboardRefreshEvent) => void
): void {
  adminDashboardHandler = onMessage;
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function unsubscribeFromAdminDashboard(): void {
  adminDashboardHandler = null;
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function subscribeToInstallerDashboard(
  installerId: string,
  onMessage: (event: DashboardRefreshEvent) => void
): void {
  installerDashboardUserId = installerId;
  installerDashboardHandler = onMessage;
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function unsubscribeFromInstallerDashboard(): void {
  installerDashboardHandler = null;
  installerDashboardUserId = null;
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function isConnected(): boolean {
  return Boolean(stompClient?.connected);
}

export function getWebSocketRefCount(): number {
  return connectionRefCount;
}

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

export function unsubscribeFromProjectMessages(projectId: number): void {
  projectMessageHandlers.delete(projectId);
}

export function subscribeToFieldUpdates(
  projectId: number,
  onMessage: (update: FieldUpdatePayload) => void
): void {
  fieldUpdateHandlers.set(projectId, onMessage);
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function unsubscribeFromFieldUpdates(projectId: number): void {
  fieldUpdateHandlers.delete(projectId);
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function subscribeToProjectUpdates(
  projectId: number,
  onMessage: (event: ProjectLiveUpdateEvent) => void
): void {
  projectUpdateHandlers.set(projectId, onMessage);
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

export function unsubscribeFromProjectUpdates(projectId: number): void {
  projectUpdateHandlers.delete(projectId);
  if (stompClient?.connected) {
    attachNotificationSubscriptions();
  }
}

/** Live project status/progress push for client detail pages. */
export interface ProjectLiveUpdateEvent {
  event: string;
  projectId: number;
  status?: string;
  currentProgress?: number;
  currentPhase?: string;
  currentFieldStatus?: string;
  timestamp?: string;
}

/** Field update payload from /topic/field-updates/{projectId}. */
export interface FieldUpdatePayload {
  id: number;
  projectId: number;
  progressPercent?: number;
  currentPhase?: string | null;
  currentPhaseLabel?: string | null;
  fieldStatus?: string;
  photoUrl?: string | null;
  createdAt?: string;
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
  attachmentFileName?: string;
  attachmentOriginalName?: string;
  attachmentContentType?: string;
  attachmentSizeBytes?: number;
  attachmentUrl?: string;
}

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

/** Event broadcast when dashboard KPIs should reload. */
export interface DashboardRefreshEvent {
  event:
    | "PROJECT_CREATED"
    | "PROJECT_UPDATED"
    | "PROJECT_DELETED"
    | "PROJECT_STATUS_CHANGED"
    | "DEMAND_CREATED"
    | "DEMAND_STATUS_CHANGED"
    | string;
  installerId?: string;
  timestamp?: string;
}
