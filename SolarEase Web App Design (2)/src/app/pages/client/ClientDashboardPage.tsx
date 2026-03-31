import { CheckCircle2, Euro, Sun, Zap } from "lucide-react";

const stats = [
  { label: "Économies estimées / an", value: "1 950 €", icon: Euro },
  { label: "Production mensuelle", value: "620 kWh", icon: Zap },
  { label: "CO₂ évité / an", value: "1.2 t", icon: Sun },
  { label: "Statut global", value: "En cours", icon: CheckCircle2 },
];

const timeline = [
  { title: "Validation du devis", date: "14 mars 2026", done: true },
  { title: "Visite technique", date: "18 mars 2026", done: true },
  { title: "Installation panneaux", date: "02 avril 2026", done: false },
  { title: "Mise en service", date: "10 avril 2026", done: false },
];

export function ClientDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-secondary">Dashboard client</h1>
        <p className="text-muted-foreground mt-1">Suivez vos projets, vos documents et vos économies en temps réel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-semibold text-secondary">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-secondary mb-4">Projet en cours</h3>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="font-medium text-secondary">Installation résidentielle 6kWc</p>
            <p className="text-sm text-muted-foreground mt-1">Adresse: Sfax, Tunisie</p>
            <p className="text-sm text-muted-foreground mt-1">Installateur: Solar Pro Team</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-secondary mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 rounded-xl bg-primary text-white hover:bg-[#43A047] transition-colors">Voir mon projet</button>
            <button className="w-full px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">Télécharger devis</button>
            <button className="w-full px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">Contacter installateur</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-secondary mb-5">Timeline d'avancement</h3>
        <div className="space-y-4">
          {timeline.map((step) => (
            <div key={step.title} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${step.done ? "bg-primary" : "bg-slate-300"}`} />
              <div>
                <p className="font-medium text-secondary">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
