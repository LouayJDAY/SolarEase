import { useMemo, useState } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";

export function SimulateurPage() {
  const [monthlyBill, setMonthlyBill] = useState(300);
  const [roofArea, setRoofArea] = useState(80);

  const result = useMemo(() => {
    const estimatedPower = Math.max(1, Math.round((roofArea / 10) * 1.2));
    const yearlySavings = Math.round(monthlyBill * 12 * 0.7);
    const roiYears = Math.max(3, Math.round((estimatedPower * 2500) / Math.max(yearlySavings, 1)));

    return { estimatedPower, yearlySavings, roiYears };
  }, [monthlyBill, roofArea]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-secondary mb-3">Simulateur solaire</h1>
          <p className="text-muted-foreground mb-8">
            Estimez rapidement la puissance recommandée et vos économies annuelles.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <label className="block text-sm text-secondary mb-2">Facture mensuelle (TND)</label>
                <input
                  type="number"
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(Number(e.target.value || 0))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-sm text-secondary mb-2">Surface de toit disponible (m²)</label>
                <input
                  type="number"
                  value={roofArea}
                  onChange={(e) => setRoofArea(Number(e.target.value || 0))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h2 className="text-2xl font-semibold text-secondary">Résultat estimatif</h2>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">Puissance recommandée</p>
                <p className="text-3xl font-bold text-primary">{result.estimatedPower} kWc</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-100">
                  <p className="text-sm text-muted-foreground">Économies/an</p>
                  <p className="text-xl font-semibold text-secondary">{result.yearlySavings} TND</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-100">
                  <p className="text-sm text-muted-foreground">ROI estimé</p>
                  <p className="text-xl font-semibold text-secondary">{result.roiYears} ans</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
