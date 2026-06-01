import { Paperclip, Send, User } from "lucide-react";
import { motion } from "motion/react";
import React from "react";

export interface Message {
  id: string;
  sender: "client" | "installateur" | "admin";
  senderName: string;
  senderRole?: string;
  recipientRoles?: string[];
  content: string;
  timestamp: string;
  read: boolean;
  attachments?: Array<{ name: string; size: string }>;
}

interface MessageThreadProps {
  messages: Message[];
  onSendMessage?: (content: string, recipientRoles?: string[]) => void;
  allowRecipientSelection?: boolean;
}

export function MessageThread({ messages, onSendMessage, allowRecipientSelection = false }: MessageThreadProps) {
  const [newMessage, setNewMessage] = React.useState("");
  const [recipientRoles, setRecipientRoles] = React.useState<string[]>(["CLIENT", "INSTALLER"]);

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

  const handleSend = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage, allowRecipientSelection ? recipientRoles : undefined);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isClient ? "bg-primary/10" : isAdmin ? "bg-amber-100" : "bg-gray-100"}`}>
                <User className={`w-5 h-5 ${isClient ? "text-primary" : isAdmin ? "text-amber-700" : "text-gray-600"}`} />
              </div>

              <div className={`flex-1 max-w-lg ${isClient ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`w-full rounded-xl p-4 ${bubbleClass}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`text-sm font-medium ${isClient ? "text-white/90" : isAdmin ? "text-amber-800" : "text-gray-600"}`}>
                      {message.senderName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${isClient ? "bg-white/20 text-white" : isAdmin ? "bg-amber-100 text-amber-800" : "bg-white text-gray-500"}`}>
                        {roleLabel(message.senderRole)}
                      </span>
                      <p className={`text-xs ${isClient ? "text-white/70" : isAdmin ? "text-amber-700" : "text-gray-500"}`}>
                      {message.timestamp}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className={`mt-3 pt-3 space-y-2 ${isClient ? "border-t border-white/20" : "border-t border-gray-200"}`}>
                      {message.attachments.map((attachment, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs">
                          <Paperclip className="w-3 h-3" />
                          <span className="flex-1">{attachment.name}</span>
                          <span className={isClient ? "text-white/70" : "text-gray-500"}>{attachment.size}</span>
                        </div>
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
            {[
              { key: "CLIENT", label: "Client" },
              { key: "INSTALLER", label: "Installateur" },
            ].map((option) => {
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
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrivez votre message..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || (allowRecipientSelection && recipientRoles.length === 0)}
            className="px-5 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 font-medium"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <button className="flex items-center space-x-1 text-xs text-gray-600 hover:text-primary transition-colors">
            <Paperclip className="w-4 h-4" />
            <span>Joindre un fichier</span>
          </button>
        </div>
      </div>
    </div>
  );
}
