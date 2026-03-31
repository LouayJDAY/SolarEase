const conversations = [
  { from: "Support SolarEase", message: "Votre visite technique est confirmée pour le 02 avril.", time: "Aujourd'hui" },
  { from: "Installateur", message: "Merci de préparer l'accès au toit le jour d'installation.", time: "Hier" },
];

export function ClientMessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-secondary">Messages</h1>
        <p className="text-muted-foreground mt-1">Échangez facilement avec votre installateur.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {conversations.map((c, index) => (
          <div key={`${c.from}-${index}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-secondary">{c.from}</p>
              <span className="text-xs text-muted-foreground">{c.time}</span>
            </div>
            <p className="text-slate-700">{c.message}</p>
          </div>
        ))}

        <textarea
          placeholder="Écrire un message..."
          className="w-full min-h-28 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-end">
          <button className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-[#43A047] transition-colors">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
