import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Send,
  Trash2,
  Printer,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import quoteService, { Quote } from "../services/quoteService";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { QuoteRejectModal } from "./QuoteRejectModal";

const money = (value: number) =>
  new Intl.NumberFormat("fr-TN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

interface Props {
  variant: "installer" | "client";
}

export function QuoteDetailContent({ variant }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [acting, setActing] = useState(false);

  const backTarget = variant === "client" ? "/client/quotes" : "/quotes";

  useEffect(() => {
    if (!id) return;
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    setLoading(true);
    try {
      const quoteId = Number(id);
      const found = await quoteService.getQuoteById(quoteId);
      if (found) {
        setQuote(found);
      } else {
        toast.error("Devis non trouve");
        navigate(backTarget);
      }
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger le devis");
      navigate(backTarget);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!quote) return;
    setActing(true);
    try {
      await quoteService.sendQuote(quote.id);
      toast.success("Devis envoye au client");
      await loadQuote();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Envoi impossible");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!quote) return;
    try {
      await quoteService.rejectQuote(quote.id, { rejectionReason: reason });
      toast.success("Devis refuse");
      setShowRejectModal(false);
      await loadQuote();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Refus impossible");
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    setActing(true);
    try {
      await quoteService.acceptQuote(quote.id);
      toast.success("Devis accepte. La facture sera generee automatiquement.");
      setShowAcceptConfirm(false);
      await loadQuote();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Acceptation impossible");
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async () => {
    if (!quote || quote.status !== "DRAFT") return;
    if (!window.confirm("Supprimer ce devis ?")) return;
    setActing(true);
    try {
      await quoteService.deleteQuote(quote.id);
      toast.success("Devis supprime");
      navigate(backTarget);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Suppression impossible");
    } finally {
      setActing(false);
    }
  };

  const handlePrint = () => {
    if (quote) {
      quoteService.printQuotePdf(quote);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Chargement du devis...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Devis non trouve</p>
      </div>
    );
  }

  const isInstaller = variant === "installer";
  const isClient = variant === "client";

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(backTarget)}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux devis
      </button>

      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center flex-wrap gap-3 mb-2">
              <h1 className="text-3xl font-bold text-secondary">{quote.quoteNumber}</h1>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-slate-500">
              Projet #{quote.projectId}
              {quote.projectName && <> &middot; {quote.projectName}</>}
            </p>
            {(quote.clientFirstName || quote.clientLastName) && (
              <p className="text-sm text-slate-500">
                Client : {quote.clientFirstName} {quote.clientLastName}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {isInstaller && quote.status === "DRAFT" && (
              <>
                <button
                  onClick={handleSend}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Envoyer au client
                </button>
                <button
                  onClick={handleDelete}
                  disabled={acting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </>
            )}

            {isInstaller && quote.status === "SENT" && (
              <button
                onClick={() => setShowRejectModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                Marquer comme refuse
              </button>
            )}

            {isClient && quote.status === "SENT" && (
              <>
                <button
                  onClick={() => setShowAcceptConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Accepter le devis
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  Refuser
                </button>
              </>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {isClient ? (
                <>
                  <Download className="w-4 h-4" />
                  Telecharger PDF
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  Imprimer PDF
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Date de creation</p>
            <div className="flex items-center gap-2 text-secondary font-medium">
              <Calendar className="w-4 h-4" />
              {new Date(quote.createdAt).toLocaleDateString("fr-TN")}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Valide jusqu'au</p>
            <div className="flex items-center gap-2 text-secondary font-medium">
              <Calendar className="w-4 h-4" />
              {new Date(quote.validUntil).toLocaleDateString("fr-TN")}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Derniere mise a jour</p>
            <div className="flex items-center gap-2 text-secondary font-medium">
              <Calendar className="w-4 h-4" />
              {new Date(quote.updatedAt).toLocaleDateString("fr-TN")}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary mb-4">Details du devis</h2>

          {quote.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-600 mb-2">Description</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{quote.description}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Main d'oeuvre</span>
              <span className="font-medium text-secondary">{money(quote.laborCost)} TND</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Materiaux</span>
              <span className="font-medium text-secondary">{money(quote.materialsCost)} TND</span>
            </div>
            {quote.tax && quote.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Taxes / TVA</span>
                <span className="font-medium text-secondary">{money(quote.tax)} TND</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-3 flex justify-between">
              <span className="font-semibold text-secondary">Montant total</span>
              <span className="text-xl font-bold text-primary">{money(quote.totalAmount)} TND</span>
            </div>
          </div>

          {quote.notes && isInstaller && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-1">Notes internes</h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary mb-4">Suivi du devis</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary">Cree</p>
                <p className="text-xs text-slate-500">
                  {new Date(quote.createdAt).toLocaleString("fr-TN")}
                </p>
              </div>
            </div>

            {quote.sentAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Envoye au client</p>
                  <p className="text-xs text-blue-700">
                    {new Date(quote.sentAt).toLocaleString("fr-TN")}
                  </p>
                </div>
              </div>
            )}

            {quote.acceptedAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50">
                <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-900">Accepte</p>
                  <p className="text-xs text-emerald-700">
                    {new Date(quote.acceptedAt).toLocaleString("fr-TN")}
                  </p>
                </div>
              </div>
            )}

            {quote.rejectedAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50">
                <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-rose-900">Refuse</p>
                  <p className="text-xs text-rose-700">
                    {new Date(quote.rejectedAt).toLocaleString("fr-TN")}
                  </p>
                  {quote.rejectionReason && (
                    <p className="text-xs text-rose-600 mt-1">Raison : {quote.rejectionReason}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <QuoteRejectModal
        open={showRejectModal}
        quoteNumber={quote.quoteNumber}
        totalAmount={quote.totalAmount}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />

      {showAcceptConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-secondary">Confirmer l'acceptation</h2>
                <p className="text-xs text-slate-500">{quote.quoteNumber}</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-700">
                Vous allez accepter ce devis pour un montant de{" "}
                <span className="font-semibold text-secondary">{money(quote.totalAmount)} TND</span>.
              </p>
              <p className="text-xs text-slate-500">
                Une facture sera generee automatiquement et le projet pourra demarrer.
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowAcceptConfirm(false)}
                disabled={acting}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAccept}
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
