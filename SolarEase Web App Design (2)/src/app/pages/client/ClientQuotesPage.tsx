import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import quoteService, { Quote } from "../../services/quoteService";
import { QuoteKpiCards } from "../../components/QuoteKpiCards";
import { QuoteFilterBar, QuoteStatusFilter } from "../../components/QuoteFilterBar";
import { QuoteList } from "../../components/QuoteList";
import { QuoteRejectModal } from "../../components/QuoteRejectModal";

const money = (value: number) =>
  new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(value);

export function ClientQuotesPage() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>("ALL");

  const [rejectTarget, setRejectTarget] = useState<Quote | null>(null);
  const [acceptTarget, setAcceptTarget] = useState<Quote | null>(null);
  const [acting, setActing] = useState(false);

  const loadQuotes = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const page = await quoteService.getClientQuotes(0, 200);
      setQuotes(page.content || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible de charger vos devis");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (statusFilter !== "ALL" && quote.status !== statusFilter) return false;
      if (q.length === 0) return true;
      const haystack = [quote.quoteNumber, quote.projectName, String(quote.projectId)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [quotes, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<QuoteStatusFilter, number>> = { ALL: quotes.length };
    quotes.forEach((q) => {
      counts[q.status] = (counts[q.status] ?? 0) + 1;
    });
    return counts;
  }, [quotes]);

  const handleAcceptConfirm = async () => {
    if (!acceptTarget) return;
    setActing(true);
    try {
      await quoteService.acceptQuote(acceptTarget.id);
      toast.success("Devis accepte. La facture sera generee automatiquement.");
      setAcceptTarget(null);
      await loadQuotes(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Acceptation impossible");
    } finally {
      setActing(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await quoteService.rejectQuote(rejectTarget.id, { rejectionReason: reason });
      toast.success("Devis refuse");
      setRejectTarget(null);
      await loadQuotes(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Refus impossible");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-1">Mes devis</h1>
          <p className="text-sm text-slate-500">
            Consultez, comparez et validez les devis envoyes par votre installateur.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadQuotes(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      <QuoteKpiCards quotes={quotes} variant="client" />

      <QuoteFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        showCounts={statusCounts}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary">Liste des devis</h2>
          <span className="text-sm text-slate-500">
            {filteredQuotes.length} / {quotes.length}
          </span>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Chargement de vos devis...</p>
          </div>
        ) : (
          <QuoteList
            quotes={filteredQuotes}
            role="CLIENT"
            onAccept={(id) => {
              const target = filteredQuotes.find((q) => q.id === id);
              if (target) setAcceptTarget(target);
            }}
            onReject={(q) => setRejectTarget(q)}
            onPreviewPdf={(q) => quoteService.printQuotePdf(q)}
            onOpenDetail={(q) => navigate(`/client/quotes/${q.id}`)}
            emptyMessage={
              quotes.length === 0
                ? "Aucun devis ne vous a encore ete envoye."
                : "Aucun devis ne correspond aux filtres."
            }
          />
        )}
      </section>

      <QuoteRejectModal
        open={!!rejectTarget}
        quoteNumber={rejectTarget?.quoteNumber}
        totalAmount={rejectTarget?.totalAmount}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      />

      {acceptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-secondary">
                  Confirmer l'acceptation
                </h2>
                <p className="text-xs text-slate-500">{acceptTarget.quoteNumber}</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700">
                Vous allez accepter ce devis pour un montant de{" "}
                <span className="font-semibold text-secondary">
                  {money(acceptTarget.totalAmount)} TND
                </span>
                .
              </p>
              <p className="text-xs text-slate-500">
                Une facture sera generee automatiquement et le projet pourra demarrer.
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setAcceptTarget(null)}
                disabled={acting}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAcceptConfirm}
                disabled={acting}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {acting ? "Acceptation..." : "Accepter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
