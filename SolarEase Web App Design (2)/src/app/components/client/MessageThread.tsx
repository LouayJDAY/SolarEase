import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send, User, X, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { downloadMessageAttachment } from "../../services/messageService";

export interface MessageAttachment {
  name: string;
  size: string;
  url: string;
  contentType?: string;
}

export interface Message {
  id: string;
  sender: "client" | "installateur" | "admin";
  senderName: string;
  senderRole?: string;
  recipientRoles?: string[];
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: MessageAttachment[];
}

interface RecipientOption {
  key: string;
  label: string;
}

interface MessageThreadProps {
  messages: Message[];
  onSendMessage?: (content: string, recipientRoles?: string[], file?: File) => void | Promise<void>;
  allowRecipientSelection?: boolean;
  senderRole?: string;
}

const ACCEPTED_FILE_TYPES =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt,.zip,image/*,application/pdf";

function recipientOptionsForRole(senderRole?: string): RecipientOption[] {
  switch (senderRole?.toUpperCase()) {
    case "ADMIN":
      return [
        { key: "CLIENT", label: "Client" },
        { key: "INSTALLER", label: "Installateur" },
      ];
    case "INSTALLER":
      return [
        { key: "CLIENT", label: "Client" },
        { key: "ADMIN", label: "Admin" },
      ];
    case "CLIENT":
      return [{ key: "INSTALLER", label: "Installateur" }];
    default:
      return [
        { key: "CLIENT", label: "Client" },
        { key: "INSTALLER", label: "Installateur" },
      ];
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function MessageThread({
  messages,
  onSendMessage,
  allowRecipientSelection = false,
  senderRole,
}: MessageThreadProps) {
  const options = useMemo(() => recipientOptionsForRole(senderRole), [senderRole]);
  const defaultRecipients = useMemo(() => options.map((o) => o.key), [options]);

  const [newMessage, setNewMessage] = useState("");
  const [recipientRoles, setRecipientRoles] = useState<string[]>(defaultRecipients);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecipientRoles(defaultRecipients);
  }, [defaultRecipients]);

  const roleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "INSTALLER":
        return "Installateur";
      case "CLIENT":
        return "Client";
      default:
        return role || "Participant";
    }
  };

  const canSend =
    (newMessage.trim().length > 0 || pendingFile != null) &&
    (!allowRecipientSelection || recipientRoles.length > 0) &&
    !sending;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileError("Le fichier ne doit pas dépasser 10 Mo.");
      e.target.value = "";
      return;
    }
    setPendingFile(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    if (!canSend || !onSendMessage) return;
    setSending(true);
    setFileError(null);
    try {
      await onSendMessage(
        newMessage.trim(),
        allowRecipientSelection ? recipientRoles : undefined,
        pendingFile ?? undefined
      );
      setNewMessage("");
      setPendingFile(null);
    } catch {
      setFileError("Impossible d'envoyer le message. Réessayez.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleAttachmentClick = async (attachment: MessageAttachment) => {
    try {
      const isImage = attachment.contentType?.startsWith("image/");
      await downloadMessageAttachment(attachment.url, attachment.name, !isImage);
    } catch {
      setFileError("Impossible de télécharger le fichier.");
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => {
          const isClient = message.sender === "client" || message.senderRole === "CLIENT";
          const isAdmin = message.sender === "admin" || message.senderRole === "ADMIN";
          const bubbleClass = isClient
            ? "bg-primary text-white"
            : isAdmin
              ? "bg-amber-50 text-amber-950 border border-amber-200"
              : "bg-gray-100 text-secondary";

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-start space-x-3 ${isClient ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isClient ? "bg-primary/10" : isAdmin ? "bg-amber-100" : "bg-gray-100"}`}
              >
                <User
                  className={`w-5 h-5 ${isClient ? "text-primary" : isAdmin ? "text-amber-700" : "text-gray-600"}`}
                />
              </div>

              <div className={`flex-1 max-w-lg ${isClient ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`w-full rounded-xl p-4 ${bubbleClass}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p
                      className={`text-sm font-medium ${isClient ? "text-white/90" : isAdmin ? "text-amber-800" : "text-gray-600"}`}
                    >
                      {message.senderName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${isClient ? "bg-white/20 text-white" : isAdmin ? "bg-amber-100 text-amber-800" : "bg-white text-gray-500"}`}
                      >
                        {roleLabel(message.senderRole)}
                      </span>
                      <p
                        className={`text-xs ${isClient ? "text-white/70" : isAdmin ? "text-amber-700" : "text-gray-500"}`}
                      >
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                  {message.content.trim() && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}

                  {message.attachments && message.attachments.length > 0 && (
                    <div
                      className={`${message.content.trim() ? "mt-3 pt-3" : ""} space-y-2 ${isClient ? "border-t border-white/20" : "border-t border-gray-200"}`}
                    >
                      {message.attachments.map((attachment, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => void handleAttachmentClick(attachment)}
                          className={`flex items-center space-x-2 text-xs w-full text-left rounded-lg px-2 py-1.5 transition-colors ${
                            isClient
                              ? "hover:bg-white/10"
                              : isAdmin
                                ? "hover:bg-amber-100/80"
                                : "hover:bg-gray-200/60"
                          }`}
                        >
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="flex-1 truncate underline-offset-2 hover:underline">
                            {attachment.name}
                          </span>
                          {attachment.size && (
                            <span className={isClient ? "text-white/70" : "text-gray-500"}>
                              {attachment.size}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!message.read && isClient && <p className="text-xs text-gray-500 mt-1 px-2">Envoyé</p>}
                {message.read && isClient && <p className="text-xs text-primary mt-1 px-2">Lu</p>}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 p-4">
        {allowRecipientSelection && (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-500 mr-1">Envoyer à :</span>
            {options.map((option) => {
              const active = recipientRoles.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    setRecipientRoles((prev) =>
                      prev.includes(option.key)
                        ? prev.filter((role) => role !== option.key)
                        : [...prev, option.key]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {pendingFile && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <Paperclip className="w-4 h-4 text-primary shrink-0" />
            <span className="flex-1 truncate text-secondary">{pendingFile.name}</span>
            <span className="text-xs text-gray-500">{formatFileSize(pendingFile.size)}</span>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              className="p-1 rounded hover:bg-primary/10 text-gray-500"
              aria-label="Retirer le fichier"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {fileError && <p className="mb-2 text-xs text-red-600">{fileError}</p>}

        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrivez votre message..."
              rows={2}
              disabled={sending}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm disabled:opacity-60"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="px-5 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 font-medium"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">{sending ? "Envoi..." : "Envoyer"}</span>
          </button>
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="flex items-center space-x-1 text-xs text-gray-600 hover:text-primary transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4" />
            <span>Joindre un fichier</span>
          </button>
          <span className="text-xs text-gray-400">PDF, images, Word, Excel, TXT, ZIP — max 10 Mo</span>
        </div>
      </div>
    </div>
  );
}
