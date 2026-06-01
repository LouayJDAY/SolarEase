import { CheckCircle } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";

const offers = [
  {
    name: "Starter",
    subtitle: "Pour petits besoins",
    price: "12,000",
    power: "3 kWc",
    recommended: false,
    items: [
      "8-10 panneaux solaires",
      "Onduleur monophasé",
      "Installation complète",
      "Monitoring basique",
      "Garantie 10 ans installation",
      "Garantie 25 ans panneaux",
      "Service après-vente",
    ],
  },
  {
    name: "Confort",
    subtitle: "Le plus populaire",
    price: "20,000",
    power: "5 kWc",
    recommended: true,
    items: [
      "14-16 panneaux solaires",
      "Onduleur premium",
      "Installation complète",
      "Monitoring intelligent",
      "Garantie 10 ans installation",
      "Garantie 25 ans panneaux",
      "Maintenance 1ère année offerte",
      "Support prioritaire",
    ],
  },
  {
    name: "Premium",
    subtitle: "Maximum d'autonomie",
    price: "35,000",
    power: "10 kWc",
    recommended: false,
    items: [
      "28-32 panneaux solaires",
      "Onduleur triphasé premium",
      "Installation complète",
      "Monitoring avancé + app",
      "Garantie 15 ans installation",
      "Garantie 25 ans panneaux",
      "Maintenance 2 ans offerte",
      "Support dédié 24/7",
    ],
  },
];

export function TarifsPage() {
  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <PublicHeader />

      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-secondary mb-3">Tarifs transparents et tout compris</h1>
            <p className="text-muted-foreground text-lg">
              Des offres claires incluant équipements, installation et garanties.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.name}
                className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
                  offer.recommended ? "border-primary ring-1 ring-primary/40" : "border-slate-200"
                }`}
              >
                {offer.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold bg-primary text-white">
                    Recommandé
                  </span>
                )}

                <h2 className="text-3xl font-bold text-secondary mb-1">{offer.name}</h2>
                <p className="text-sm text-muted-foreground mb-4">{offer.subtitle}</p>

                <div className="mb-4">
                  <p className="text-4xl font-bold text-secondary">
                    {offer.price} <span className="text-xl text-muted-foreground">TND</span>
                  </p>
                  <p className="text-primary font-semibold mt-1">{offer.power}</p>
                </div>

                <ul className="space-y-2">
                  {offer.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-secondary">Besoin d’un chiffrage précis ?</h2>
            <p className="text-muted-foreground mt-2">
              Lancez une simulation gratuite puis recevez un devis personnalisé en moins de 24h.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/simulateur"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
              >
                Simuler mon projet
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-slate-300 text-secondary hover:bg-slate-50 transition-colors font-medium group"
              >
                Demander un devis
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
