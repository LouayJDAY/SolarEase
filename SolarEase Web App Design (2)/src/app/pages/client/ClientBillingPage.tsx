const invoices = [
  { id: "FAC-2026-001", amount: "2 400 €", status: "Payée", dueDate: "20/03/2026" },
  { id: "FAC-2026-002", amount: "1 600 €", status: "À payer", dueDate: "20/04/2026" },
];

export function ClientBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-secondary">Facturation</h1>
        <p className="text-muted-foreground mt-1">Suivez vos paiements et échéances.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Facture</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Montant</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Échéance</th>
              <th className="text-left px-6 py-3 text-sm text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                <td className="px-6 py-4 font-medium text-secondary">{inv.id}</td>
                <td className="px-6 py-4 text-slate-700">{inv.amount}</td>
                <td className="px-6 py-4 text-slate-700">{inv.dueDate}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${inv.status === "Payée" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
