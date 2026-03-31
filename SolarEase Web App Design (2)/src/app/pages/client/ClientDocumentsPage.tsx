const docs = [
  { name: "Devis signé.pdf", type: "Devis", date: "14/03/2026" },
  { name: "Contrat installation.pdf", type: "Contrat", date: "15/03/2026" },
  { name: "Facture acompte.pdf", type: "Facture", date: "20/03/2026" },
];

export function ClientDocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-secondary">Documents</h1>
        <p className="text-muted-foreground mt-1">Tous vos documents centralisés en un seul endroit.</p>
      </div>

      <div className="grid gap-4">
        {docs.map((doc) => (
          <div key={doc.name} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-medium text-secondary">{doc.name}</p>
              <p className="text-sm text-muted-foreground">{doc.type} • {doc.date}</p>
            </div>
            <button className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">Télécharger</button>
          </div>
        ))}
      </div>
    </div>
  );
}
