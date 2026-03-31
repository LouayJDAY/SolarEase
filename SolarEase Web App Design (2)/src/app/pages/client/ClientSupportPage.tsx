export function ClientSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-secondary">Support</h1>
        <p className="text-muted-foreground mt-1">Notre équipe vous répond rapidement.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm text-secondary mb-1">Sujet</label>
          <input className="w-full px-4 py-2.5 rounded-lg border border-slate-200" placeholder="Ex: Suivi de mon installation" />
        </div>
        <div>
          <label className="block text-sm text-secondary mb-1">Message</label>
          <textarea className="w-full min-h-36 px-4 py-3 rounded-lg border border-slate-200" placeholder="Décrivez votre besoin..." />
        </div>
        <div className="flex justify-end">
          <button className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-[#43A047] transition-colors">
            Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  );
}
