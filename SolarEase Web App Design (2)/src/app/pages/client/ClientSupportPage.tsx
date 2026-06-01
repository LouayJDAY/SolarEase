import React, { useState } from "react";
import { TicketCard, TicketStatus, TicketPriority } from "../../components/client/TicketCard";
import { HelpCircle, Send, Plus } from "lucide-react";
import { toast } from "sonner";

export function ClientSupportPage() {
  const [selectedTab, setSelectedTab] = useState<"contact" | "tickets">("contact");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const tickets = [
    { id: "1", title: "Problème de monitoring", description: "Le graphique ne s'affiche plus", status: "EN_COURS" as TicketStatus, priority: "HAUTE" as TicketPriority, createdAt: "Hier", lastUpdate: "Il y a 2h", messageCount: 3 },
    { id: "2", title: "Question garantie", description: "Durée et conditions", status: "RESOLU" as TicketStatus, priority: "BASSE" as TicketPriority, createdAt: "Il y a 5 jours", lastUpdate: "Il y a 2 jours", messageCount: 5 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Support & Aide</h1>
        <p className="text-gray-600">Nous sommes là pour vous aider</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 flex space-x-8 px-6">
          <button onClick={() => setSelectedTab("contact")} className={`py-4 border-b-2 font-medium ${selectedTab === "contact" ? "border-primary text-primary" : "border-transparent text-gray-500"}`}>Nouveau contact</button>
          <button onClick={() => setSelectedTab("tickets")} className={`py-4 border-b-2 font-medium ${selectedTab === "tickets" ? "border-primary text-primary" : "border-transparent text-gray-500"}`}>Mes tickets</button>
        </div>

        <div className="p-6">
          {selectedTab === "contact" ? (
            <form onSubmit={(e) => { e.preventDefault(); toast.success("Message envoyé"); setSubject(""); setMessage(""); }} className="space-y-4">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Décrivez votre problème..." className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
              <button type="submit" className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg"><Send className="w-4 h-4" /><span>Envoyer</span></button>
            </form>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-secondary">Mes tickets de support</h2>
                <button onClick={() => setSelectedTab("contact")} className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg text-sm"><Plus className="w-4 h-4" /><span>Nouveau ticket</span></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id} {...ticket} onView={() => toast.info("Ouverture du ticket...")} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4"><HelpCircle className="w-5 h-5 text-primary" /><h3 className="text-lg font-bold text-secondary">Questions fréquentes</h3></div>
        <p className="text-gray-600">Consultez la FAQ complète pour les questions courantes sur vos installations.</p>
      </div>
    </div>
  );
}
