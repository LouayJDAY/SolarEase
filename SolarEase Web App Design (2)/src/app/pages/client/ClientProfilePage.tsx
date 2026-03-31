export function ClientProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-secondary">Mon profil</h1>
        <p className="text-muted-foreground mt-1">Mettez à jour vos informations personnelles.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-secondary mb-1">Prénom</label>
          <input className="w-full px-4 py-2.5 rounded-lg border border-slate-200" defaultValue="Louay" />
        </div>
        <div>
          <label className="block text-sm text-secondary mb-1">Nom</label>
          <input className="w-full px-4 py-2.5 rounded-lg border border-slate-200" defaultValue="Jday" />
        </div>
        <div>
          <label className="block text-sm text-secondary mb-1">Email</label>
          <input className="w-full px-4 py-2.5 rounded-lg border border-slate-200" defaultValue="client@solarease.com" />
        </div>
        <div>
          <label className="block text-sm text-secondary mb-1">Téléphone</label>
          <input className="w-full px-4 py-2.5 rounded-lg border border-slate-200" defaultValue="+216 29 672 065" />
        </div>
        <div className="md:col-span-2 flex justify-end pt-2">
          <button className="px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-[#43A047] transition-colors">
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
