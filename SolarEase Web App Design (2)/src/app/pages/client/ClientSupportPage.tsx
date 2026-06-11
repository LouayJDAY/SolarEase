import React, { useCallback, useEffect, useState } from "react";
import { TicketCard, TicketStatus, TicketPriority } from "../../components/client/TicketCard";
import { HelpCircle, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import supportService, { SupportTicket } from "../../services/supportService";
import { supportTicketSchema } from "../../validation/commerceSchemas";
import { getApiErrorMessage } from "../../utils/apiError";

function mapStatus(status: SupportTicket["status"]): TicketStatus {
  switch (status) {
    case "OPEN":
      return "OUVERT";
    case "IN_PROGRESS":
      return "EN_COURS";
    case "RESOLVED":
      return "RESOLU";
    default:
      return "OUVERT";
  }
}

function mapPriority(priority: SupportTicket["priority"]): TicketPriority {
  switch (priority) {
    case "LOW":
      return "BASSE";
    case "HIGH":
      return "HAUTE";
    default:
      return "MOYENNE";
  }
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  return `Il y a ${diffD} jours`;
}

export function ClientSupportPage() {
  const [selectedTab, setSelectedTab] = useState<"contact" | "tickets">("contact");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await supportService.getMyTickets();
      setTickets(data);
    } catch {
      toast.error("Impossible de charger vos tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTab === "tickets") {
      loadTickets();
    }
  }, [selectedTab, loadTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = supportTicketSchema.safeParse({
      subject: subject.trim(),
      description: message.trim(),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Veuillez remplir le sujet et le message");
      return;
    }
    try {
      setSubmitting(true);
      await supportService.createTicket(parsed.data);
      toast.success("Ticket créé — votre installateur a été notifié");
      setSubject("");
      setMessage("");
      setSelectedTab("tickets");
      await loadTickets();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTicket = async (id: string) => {
    try {
      const ticket = await supportService.getTicket(Number(id));
      setSelectedTicket(ticket);
    } catch {
      toast.error("Impossible d'ouvrir le ticket");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Support & Aide</h1>
        <p className="text-gray-600">Nous sommes là pour vous aider</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 flex space-x-8 px-6">
          <button
            onClick={() => setSelectedTab("contact")}
            className={`py-4 border-b-2 font-medium ${selectedTab === "contact" ? "border-primary text-primary" : "border-transparent text-gray-500"}`}
          >
            Nouveau contact
          </button>
          <button
            onClick={() => setSelectedTab("tickets")}
            className={`py-4 border-b-2 font-medium ${selectedTab === "tickets" ? "border-primary text-primary" : "border-transparent text-gray-500"}`}
          >
            Mes tickets
          </button>
        </div>

        <div className="p-6">
          {selectedTab === "contact" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="Décrivez votre problème..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Envoi..." : "Envoyer"}</span>
              </button>
            </form>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-secondary">Mes tickets de support</h2>
                <button
                  onClick={() => setSelectedTab("contact")}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau ticket</span>
                </button>
              </div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : tickets.length === 0 ? (
                <p className="text-gray-500 text-center py-12">Aucun ticket pour le moment.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      id={String(ticket.id)}
                      title={ticket.subject}
                      description={ticket.description}
                      status={mapStatus(ticket.status)}
                      priority={mapPriority(ticket.priority)}
                      createdAt={formatRelative(ticket.createdAt)}
                      lastUpdate={formatRelative(ticket.updatedAt)}
                      messageCount={1}
                      onView={handleViewTicket}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold text-secondary mb-2">{selectedTicket.subject}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {mapStatus(selectedTicket.status)} · {formatRelative(selectedTicket.createdAt)}
            </p>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{selectedTicket.description}</p>
            <button
              onClick={() => setSelectedTicket(null)}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-secondary">Questions fréquentes</h3>
        </div>
        <p className="text-gray-600">
          Consultez la FAQ complète pour les questions courantes sur vos installations.
        </p>
      </div>
    </div>
  );
}
