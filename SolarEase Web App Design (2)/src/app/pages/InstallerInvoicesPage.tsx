import React, { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Search,
  AlertCircle,
  Loader2,
  Receipt,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Send,
  FileEdit,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Pagination } from "../components/Pagination";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { EditInvoiceModal, InvoiceEditData } from "../components/EditInvoiceModal";
import { toast } from "sonner";

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  subtotal?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  status: string;
  notes?: string | null;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PAID:      { label: "Payée",      icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: "bg-green-100 text-green-700" },
  PENDING:   { label: "En attente", icon: <Clock className="w-3.5 h-3.5" />,        className: "bg-yellow-100 text-yellow-700" },
  OVERDUE:   { label: "En retard",  icon: <AlertTriangle className="w-3.5 h-3.5" />, className: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Annulée",    icon: <XCircle className="w-3.5 h-3.5" />,      className: "bg-slate-100 text-slate-600" },
  SENT:      { label: "Envoyée",    icon: <Send className="w-3.5 h-3.5" />,         className: "bg-blue-100 text-blue-700" },
  DRAFT:     { label: "Brouillon",  icon: <FileEdit className="w-3.5 h-3.5" />,     className: "bg-slate-100 text-slate-500" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: null, className: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

const money = (v: number) =>
  new Intl.NumberFormat("fr-TN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v) + " TND";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

export function InstallerInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [editInvoice, setEditInvoice] = useState<InvoiceEditData | null>(null);
  const itemsPerPage = 10;
  const isAdmin = user?.role === "ADMIN";

  const fetchInvoices = useCallback(async (page: number) => {
    setLoading(true);
    setError("");
    try {
      const endpoint = isAdmin ? "/invoices/admin/list" : "/invoices/installer/list";
      const res = await api.get<Page<Invoice>>(endpoint, {
        params: { page: page - 1, size: itemsPerPage, sort: "date,desc" },
      });
      setInvoices(res.data.content);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      setError("Impossible de charger les factures.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [fetchInvoices, currentPage]);

  const filtered = invoices.filter((inv) =>
    !search.trim() ||
    inv.number?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(totalElements / itemsPerPage);

  const openInvoicePdf = async (invoiceId: string) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: "blob" });
      const fileUrl = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      window.open(fileUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } catch {
      toast.error("Impossible d'ouvrir le PDF de la facture.");
    }
  };

  const sendInvoice = async (invoiceId: string) => {
    try {
      await api.post(`/invoices/${invoiceId}/send`);
      toast.success("Facture envoyée au client et à l'installateur concerné.");
      fetchInvoices(currentPage);
    } catch {
      toast.error("Impossible d'envoyer la facture.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-secondary flex items-center gap-2">
                <Receipt className="w-6 h-6 text-primary" />
                Factures
              </h1>
              <p className="text-muted-foreground mt-1">
                {isAdmin ? "Factures de l'ensemble des projets" : "Factures liées à vos projets assignés"}
              </p>
              {!loading && totalElements > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {totalElements} facture{totalElements > 1 ? "s" : ""} au total
                </p>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par numéro de facture..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-3">
              <span className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </span>
              <button
                onClick={() => fetchInvoices(currentPage)}
                className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 text-sm"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary mb-2">Aucune facture</h3>
              <p className="text-muted-foreground text-sm">
                {search
                  ? "Aucune facture ne correspond à votre recherche."
                  : "Les factures générées depuis les devis acceptés apparaîtront ici."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Numéro
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Échéance
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Montant
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Statut
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-secondary flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        {inv.number || `FAC-${inv.id}`}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{fmtDate(inv.date)}</td>
                      <td className="px-5 py-4 text-slate-600">{fmtDate(inv.dueDate)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-secondary">
                        {money(inv.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditInvoice(inv)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                            title="Modifier la facture"
                          >
                            <FileEdit className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => openInvoicePdf(inv.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                            title="Voir la facture en PDF"
                          >
                            <Eye className="w-4 h-4" />
                            PDF
                          </button>
                          <button
                            onClick={() => sendInvoice(inv.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90"
                            title="Envoyer la facture"
                          >
                            <Send className="w-4 h-4" />
                            Envoyer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalElements > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalElements}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </main>
      <EditInvoiceModal
        invoice={editInvoice}
        onClose={() => setEditInvoice(null)}
        onSaved={() => {
          toast.success("Facture mise à jour.");
          fetchInvoices(currentPage);
        }}
      />
    </div>
  );
}
