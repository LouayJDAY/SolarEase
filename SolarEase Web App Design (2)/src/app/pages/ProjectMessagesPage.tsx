import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MessageThread } from "../components/client/MessageThread";
import { ArrowLeft, MessageSquare, Search, Shield, User, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router";
import messageService, { Conversation, messageToAttachments } from "../services/messageService";
import { useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import projectService, { ProjectResponse } from "../services/projectService";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import {
  subscribeToProjectMessages,
  unsubscribeFromProjectMessages,
  connectWebSocket,
  MessagePayload,
} from "../services/websocketService";

export function ProjectMessagesPage() {
  const { user } = useAuth();
  const params = useParams();
  const projectId = Number(params.id);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState("");

  const fetchConversations = useCallback(async () => {
    if (!projectId || Number.isNaN(projectId) || !user?.userId) return;
    setLoading(true);
    setLoadError("");
    try {
      const [projectData, data] = await Promise.all([
        projectService.getProject(projectId),
        messageService.getProjectConversations(projectId),
      ]);
      setProject(projectData);
      setConversations(data);
      if (data.length > 0) {
        setSelectedConversation((current) => current && data.some((c) => c.id === current) ? current : data[0].id);
      } else {
        setSelectedConversation(null);
      }
    } catch (e) {
      console.error("Error fetching project conversations:", e);
      setLoadError("Impossible de charger les messages du projet.");
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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

  useLiveRefresh({
    userId: user?.userId,
    token: localStorage.getItem("accessToken"),
    intervalMs: 5000,
    onRefresh: fetchConversations,
  });

  // Real-time WebSocket subscription for incoming messages
  useEffect(() => {
    if (!projectId || Number.isNaN(projectId) || !user?.userId) return;
    const token = localStorage.getItem("accessToken");
    if (token) {
      connectWebSocket(user.userId, token, {});
    }

    subscribeToProjectMessages(projectId, (incoming: MessagePayload) => {
      if (!canViewMessage(incoming as Conversation["messages"][number])) {
        return;
      }
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== incoming.conversationId) return conv;
          const alreadyExists = conv.messages.some((m) => m.id === incoming.id);
          if (alreadyExists) return conv;
          return { ...conv, messages: [...conv.messages, incoming] };
        })
      );
    });

    return () => {
      unsubscribeFromProjectMessages(projectId);
    };
  }, [projectId, user?.userId, user?.role, canViewMessage]);

  const handleSend = async (content: string, recipientRoles?: string[], file?: File) => {
    if (!user?.userId || Number.isNaN(projectId)) return;
    try {
      const senderName = `${user.firstName} ${user.lastName}`.trim();
      const payload = {
        senderId: user.userId,
        senderName,
        senderRole: user.role,
        recipientRoles,
        content,
      };
      const msg = file
        ? await messageService.sendProjectMessageWithAttachment(projectId, payload, file)
        : await messageService.sendProjectMessage(projectId, payload);
      // Optimistically append; WS echo will be deduped by id guard
      if (!canViewMessage(msg as Conversation["messages"][number])) {
        return;
      }
      setConversations((prev) =>
        prev.map((c) => {
          const alreadyExists = c.messages.some((m) => m.id === msg.id);
          if (alreadyExists) return c;
          return { ...c, messages: [...c.messages, msg] };
        })
      );
    } catch (e) {
      console.error("Error sending message:", e);
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
  const visibleMessages = selectedConv?.messages.filter(canViewMessage) ?? [];
  const projectTitle = project?.name || (Number.isNaN(projectId) ? "Messages" : `Projet #${projectId}`);

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 flex items-center justify-center" style={{ height: "calc(100vh - 4rem)" }}>
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement des conversations...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      <main className="ml-64 pt-16 p-6 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1 min-h-0 shadow-sm flex flex-col">
            {/* Page header — shrinks to its natural height */}
            <div className="shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-emerald-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <Link to="/projects" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Retour
                  </Link>
                  <span>•</span>
                  <span>Conversation projet</span>
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-secondary truncate">{projectTitle}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                  {project ? <span>{project.location}</span> : null}
                  {project ? <span className="inline-flex items-center gap-1"><Shield className="w-4 h-4" /> Accès partagé selon le rôle</span> : null}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p className="font-medium text-secondary">{conversations.length} conversation{conversations.length > 1 ? "s" : ""}</p>
                <p className="text-xs mt-1">Mise à jour automatique</p>
              </div>
            </div>

            {loadError && (
              <div className="shrink-0 mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-3">
                <span>{loadError}</span>
                <button type="button" onClick={fetchConversations} className="px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors">
                  Réessayer
                </button>
              </div>
            )}

            {/* Conversations grid — takes all remaining space */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 bg-white">
              {/* Conversations List */}
              <div className="flex flex-col bg-gradient-to-b from-gray-50 to-white">
                <div className="p-4 md:p-6 border-b border-gray-200 shrink-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base md:text-lg font-semibold text-secondary">Conversations</h3>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {conversations.length}
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConversation(c.id)}
                        className={`w-full px-3 md:px-4 py-3 md:py-4 text-left border-b border-gray-100 transition-all ${
                          selectedConversation === c.id
                            ? "bg-primary/8 border-l-4 border-l-primary shadow-sm"
                            : "hover:bg-gray-100/50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-secondary text-sm truncate">
                              {project?.name || `Projet #${projectId}`}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {c.participants.length > 0
                                ? c.participants.slice(0, 2).join(", ") + (c.participants.length > 2 ? ` +${c.participants.length - 2}` : "")
                                : "Conversation projet"}
                            </p>
                            {c.messages.length > 0 ? (
                              <>
                                <p className="text-xs text-gray-600 truncate line-clamp-1 mt-1.5">
                                  {c.messages[c.messages.length - 1].senderName}:
                                </p>
                                <p className="text-xs text-gray-500 truncate line-clamp-1">
                                  {c.messages[c.messages.length - 1].content}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(c.messages[c.messages.length - 1].timestamp).toLocaleDateString("fr-FR")}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-gray-400 italic mt-1.5">Aucun message</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 md:p-8 text-center text-gray-500">
                      <MessageSquare className="w-10 h-10 mb-3 text-gray-300" />
                      {searchQuery ? (
                        <>
                          <p className="font-medium text-sm">Aucune conversation trouvée</p>
                          <p className="text-xs mt-1">Essayez une autre recherche</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-sm">Aucune conversation</p>
                          <p className="text-xs mt-1">Envoyez le premier message pour démarrer</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="lg:col-span-2 flex flex-col bg-white">
                {selectedConv ? (
                  <MessageThread
                    messages={
                      visibleMessages.map((m) => ({
                        id: m.id,
                        sender: m.senderRole === "CLIENT" ? "client" : m.senderRole === "ADMIN" ? "admin" : "installateur",
                        senderName: m.senderName,
                        senderRole: m.senderRole,
                        recipientRoles: m.recipientRoles,
                        content: m.content,
                        timestamp: new Date(m.timestamp).toLocaleString("fr-FR"),
                        read: true,
                        attachments: messageToAttachments(m),
                      })) || []
                    }
                    onSendMessage={handleSend}
                    allowRecipientSelection={
                      user?.role === "ADMIN" || user?.role === "INSTALLER"
                    }
                    senderRole={user?.role}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-4 md:px-6 text-center gap-4">
                    <MessageSquare className="w-12 h-12 text-gray-300" />
                    <div>
                      <p className="font-medium text-secondary text-base">Sélectionnez une conversation</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Envoyez le premier message pour démarrer. Les messages sont partagés
                        entre l&apos;admin, le client et l&apos;installateur.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
    </div>
  );
}
