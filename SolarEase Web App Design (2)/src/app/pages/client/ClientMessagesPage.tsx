import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageThread, Message } from "../../components/client/MessageThread";
import { User, Search, Loader2, MessageSquare } from "lucide-react";
import messageService, { Conversation, messageToAttachments } from "../../services/messageService";
import { useAuth } from "../../context/AuthContext";
import { useLiveRefresh } from "../../hooks/useLiveRefresh";
import {
  connectWebSocket,
  subscribeToProjectMessages,
  unsubscribeFromProjectMessages,
  MessagePayload,
} from "../../services/websocketService";

export function ClientMessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await messageService.getConversations(user.userId);
      setConversations(data);
      if (data.length > 0) {
        setSelectedConversation((current) =>
          current && data.some((c) => c.id === current) ? current : data[0].id
        );
      }
    } catch (e) {
      console.error(e);
      setError("Impossible de charger les conversations.");
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  const canViewMessage = useCallback(
    (message: Conversation["messages"][number]) => {
      if (!user?.role) return true;
      if (user.role === "ADMIN") return true;
      if (message.senderId === user.userId) return true;
      if (!message.recipientRoles || message.recipientRoles.length === 0) return true;
      return message.recipientRoles.includes(user.role);
    },
    [user?.role, user?.userId]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useLiveRefresh({
    userId: user?.userId,
    token: localStorage.getItem("accessToken"),
    intervalMs: 5000,
    onRefresh: fetchConversations,
  });

  // WebSocket real-time subscriptions for each conversation's projectId
  useEffect(() => {
    if (!user?.userId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    connectWebSocket(token, user.userId, user.role ?? "CLIENT");

    const projectIds = conversations
      .map((c) => c.projectId)
      .filter((id): id is number => id != null);

    projectIds.forEach((projectId) => {
      subscribeToProjectMessages(String(projectId), (incoming: MessagePayload) => {
        if (!canViewMessage(incoming as Conversation["messages"][number])) {
          return;
        }
        setConversations((prev) =>
          prev.map((c) => {
            if (c.projectId !== projectId) return c;
            const alreadyExists = c.messages.some((m) => m.id === incoming.id);
            if (alreadyExists) return c;
            const newMsg = {
              id: incoming.id,
              conversationId: incoming.conversationId ?? c.id,
              senderId: incoming.senderId,
              senderName: incoming.senderName,
              senderRole: incoming.senderRole,
              recipientRoles: incoming.recipientRoles,
              content: incoming.content,
              timestamp: incoming.timestamp,
            };
            return { ...c, messages: [...c.messages, newMsg] };
          })
        );
      });
    });

    return () => {
      projectIds.forEach((projectId) => unsubscribeFromProjectMessages(String(projectId)));
    };
  }, [conversations.length, user?.userId, user?.role, canViewMessage]);

  const handleSend = async (content: string, _recipientRoles?: string[], file?: File) => {
    if (!user?.userId || !selectedConversation) return;
    const selected = conversations.find((c) => c.id === selectedConversation);
    try {
      const payload = {
        senderId: user.userId,
        senderName: `${user.firstName} ${user.lastName}`.trim(),
        senderRole: user.role,
        content,
        projectId: selected?.projectId,
      };
      const msg = file
        ? await messageService.sendMessageWithAttachment(
            user.userId,
            selectedConversation,
            payload,
            file
          )
        : await messageService.sendMessage(user.userId, selectedConversation, payload);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== selectedConversation) return c;
          const alreadyExists = c.messages.some((m) => m.id === msg.id);
          if (alreadyExists) return c;
          return { ...c, messages: [...c.messages, msg] };
        })
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) =>
        c.participants.join(", ").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [conversations, searchQuery]
  );

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  const toThreadMessage = (m: Conversation["messages"][number]): Message => ({
    id: m.id,
    sender:
      m.senderRole === "CLIENT"
        ? "client"
        : m.senderRole === "ADMIN"
        ? "admin"
        : "installateur",
    senderName: m.senderName,
    senderRole: m.senderRole,
    recipientRoles: m.recipientRoles,
    content: m.content,
    timestamp: new Date(m.timestamp).toLocaleString(),
    read: true,
    attachments: messageToAttachments(m),
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
        {/* Sidebar */}
        <div>
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Chargement...
            </div>
          )}

          {error && !loading && (
            <div className="p-4 text-red-600 text-sm">
              {error}{" "}
              <button onClick={fetchConversations} className="underline">
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <MessageSquare className="w-10 h-10 mb-3 text-gray-300" />
              <p className="font-medium">Aucune conversation</p>
              <p className="text-sm mt-1">Les messages de vos projets apparaîtront ici.</p>
            </div>
          )}

          {filteredConversations.map((c) => {
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedConversation(c.id)}
                className={`w-full p-4 text-left border-b border-gray-100 transition-colors ${
                  selectedConversation === c.id
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-secondary text-sm truncate">
                      {c.participants.join(" · ") || `Projet #${c.projectId ?? c.id}`}
                    </p>
                    {c.projectId && (
                      <p className="text-xs text-primary/70">Projet #{c.projectId}</p>
                    )}
                    {lastMsg && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{lastMsg.content}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Thread */}
        <div className="lg:col-span-2">
          {!selectedConv && !loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-gray-500 p-8">
              <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
              <p className="font-medium">Sélectionnez une conversation</p>
              <p className="text-sm mt-1">
                Envoyez le premier message pour démarrer la discussion.
              </p>
            </div>
          ) : (
            <MessageThread
              messages={selectedConv?.messages.map(toThreadMessage) ?? []}
              onSendMessage={handleSend}
            />
          )}
        </div>
      </div>
    </div>
  );
}
