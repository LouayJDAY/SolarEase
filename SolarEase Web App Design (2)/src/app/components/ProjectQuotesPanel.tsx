import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { FileText, Loader2, Plus, Send, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import quoteService, { Quote } from "../services/quoteService";
import { QuoteStatusBadge } from "./QuoteStatusBadge";

const money = (v: number) =>
  new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(v);

interface Props {
  projectId: number;
  projectName?: string;
}

export function ProjectQuotesPanel({ projectId, projectName }: Props) {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await quoteService.getProjectQuotes(projectId);
      setQuotes(list);
    } catch {
      toast.error("Impossible de charger les devis du projet");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async (quoteId: number) => {
    setActingId(quoteId);
    try {
      await quoteService.sendQuote(quoteId);
      toast.success("Devis envoyé au client");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Envoi impossible");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (quoteId: number) => {
    if (!window.confirm("Supprimer ce brouillon ?")) return;
    setActingId(quoteId);
    try {
      await quoteService.deleteQuote(quoteId);
      toast.success("Devis supprimé");
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Suppression impossible");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Chargement des devis…
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Devis du projet
          </h2>
          {projectName && (
            <p className="text-xs text-muted-foreground mt-0.5">{projectName}</p>
          )}
        </div>
        <Link
          to={`/quotes?createFor=${projectId}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Nouveau devis
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground border border-dashed border-slate-200 rounded-lg">
          Aucun devis pour ce projet. Créez-en un pour l&apos;envoyer au client.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <button
                type="button"
                onClick={() => navigate(`/quotes/${q.id}`)}
                className="text-left min-w-0 flex-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-secondary">{q.quoteNumber}</span>
                  <QuoteStatusBadge status={q.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {money(q.totalAmount)} TND · valide jusqu&apos;au{" "}
                  {new Date(q.validUntil).toLocaleDateString("fr-TN")}
                </p>
              </button>
              <div className="flex items-center gap-2">
                {q.status === "DRAFT" && (
                  <>
                    <button
                      type="button"
                      disabled={actingId === q.id}
                      onClick={() => handleSend(q.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Envoyer
                    </button>
                    <button
                      type="button"
                      disabled={actingId === q.id}
                      onClick={() => handleDelete(q.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
