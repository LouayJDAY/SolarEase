import React from "react";
import { FileText, Clock, CheckCircle2, Wallet, XCircle, AlertCircle, LucideIcon } from "lucide-react";
import type { Quote, QuoteStatus } from "../services/quoteService";

const money = (value: number) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export type QuoteKpiVariant = "installer" | "admin" | "client";

interface Props {
  quotes: Quote[];
  variant: QuoteKpiVariant;
}

interface Card {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accent?: string;
}

const countByStatus = (quotes: Quote[], statuses: QuoteStatus[]) =>
  quotes.filter((q) => statuses.includes(q.status)).length;

const sumByStatus = (quotes: Quote[], statuses: QuoteStatus[]) =>
  quotes
    .filter((q) => statuses.includes(q.status))
    .reduce((acc, q) => acc + (q.totalAmount ?? 0), 0);

export function QuoteKpiCards({ quotes, variant }: Props) {
  let cards: Card[] = [];

  if (variant === "client") {
    const toAct = countByStatus(quotes, ["SENT"]);
    const accepted = countByStatus(quotes, ["ACCEPTED", "INVOICED"]);
    const rejected = countByStatus(quotes, ["REJECTED", "EXPIRED"]);
    const totalAccepted = sumByStatus(quotes, ["ACCEPTED", "INVOICED"]);

    cards = [
      {
        title: "A traiter",
        value: String(toAct),
        subtitle: toAct > 0 ? "Action requise" : "Tout est a jour",
        icon: AlertCircle,
        iconBg: toAct > 0 ? "bg-amber-100" : "bg-slate-100",
        iconColor: toAct > 0 ? "text-amber-600" : "text-slate-500",
        accent: toAct > 0 ? "ring-1 ring-amber-200" : undefined,
      },
      {
        title: "Acceptes",
        value: String(accepted),
        subtitle: accepted > 0 ? `${money(totalAccepted)} TND engages` : "Aucun pour le moment",
        icon: CheckCircle2,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        title: "Refuses",
        value: String(rejected),
        subtitle: "Devis refuses ou expires",
        icon: XCircle,
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
      },
    ];
  } else {
    const total = quotes.length;
    const drafts = countByStatus(quotes, ["DRAFT"]);
    const pending = countByStatus(quotes, ["SENT"]);
    const accepted = countByStatus(quotes, ["ACCEPTED", "INVOICED"]);
    const totalAccepted = sumByStatus(quotes, ["ACCEPTED", "INVOICED"]);

    cards = [
      {
        title: variant === "admin" ? "Devis (global)" : "Mes devis",
        value: String(total),
        subtitle: total > 0 ? `${drafts} brouillon${drafts > 1 ? "s" : ""}` : "Aucun devis",
        icon: FileText,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
      },
      {
        title: "En attente client",
        value: String(pending),
        subtitle: pending > 0 ? "Reponse attendue" : "Aucun devis envoye",
        icon: Clock,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
      {
        title: "Acceptes",
        value: String(accepted),
        subtitle: accepted > 0 ? "Pret a facturer" : "Aucun pour le moment",
        icon: CheckCircle2,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        title: "Montant accepte",
        value: `${money(totalAccepted)} TND`,
        subtitle: "Total accepte + facture",
        icon: Wallet,
        iconBg: "bg-amber-100",
        iconColor: "bg-amber-600 text-white".replace("bg-amber-600 ", "text-amber-600 "),
      },
    ];
  }

  const gridCols = cards.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow ${card.accent ?? ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">{card.title}</p>
                <h3 className="text-2xl font-bold text-secondary leading-tight truncate">{card.value}</h3>
                {card.subtitle && (
                  <p className="text-xs text-slate-500 mt-1.5">{card.subtitle}</p>
                )}
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
