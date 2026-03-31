const projects = [
  { id: "PRJ-2026-001", name: "Installation résidentielle 6kWc", status: "En cours", progress: 65, date: "Mars 2026" },
  { id: "PRJ-2025-011", name: "Maintenance annuelle", status: "Terminé", progress: 100, date: "Déc 2025" },
];

export function ClientProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-secondary">Mes projets</h1>
        <p className="text-muted-foreground mt-1">Consultez l'état d'avancement de vos projets solaires.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Référence</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Projet</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Statut</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Progression</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0">
                <td className="px-6 py-4 text-sm font-medium text-secondary">{p.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.name}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === "Terminé" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
