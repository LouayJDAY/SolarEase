import React, { useEffect, useState } from "react";
import { InvoiceCard, InvoiceStatus } from "../../components/client/InvoiceCard";
import { CheckCircle, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import billingService from "../../services/billingService";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export function ClientBillingPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"invoices" | "payments">("invoices");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const data = await billingService.getInvoices(user.userId);
        setInvoices(data.map((i) => ({ ...i, date: new Date(i.date).toLocaleDateString(), dueDate: new Date(i.dueDate).toLocaleDateString() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  if (loading) return <div>Chargement...</div>;

  const total = invoices.reduce((s, i) => s + (i.amount || 0), 0);
  const paid = invoices.filter((i) => i.status === "PAYEE").length;
  const pending = invoices.filter((i) => i.status !== "PAYEE").length;

  const openInvoicePdf = async (invoiceId: string, download = false) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/pdf`, { responseType: "blob" });
      const fileUrl = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));

      if (download) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `facture-${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }

      setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
    } catch {
      toast.error("Impossible d'ouvrir le PDF de la facture.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary mb-2">Facturation & Paiements</h1>
        <p className="text-gray-600">Gérez vos factures et historique de paiements</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200"><DollarSign className="w-6 h-6 text-blue-700" /><p className="text-sm text-gray-600 mt-2">Total</p><p className="text-2xl font-bold text-secondary">{total.toLocaleString()} TND</p></div>
        <div className="bg-white rounded-xl p-6 border border-gray-200"><CheckCircle className="w-6 h-6 text-green-700" /><p className="text-sm text-gray-600 mt-2">Payées</p><p className="text-2xl font-bold text-secondary">{paid}</p></div>
        <div className="bg-white rounded-xl p-6 border border-gray-200"><Clock className="w-6 h-6 text-orange-700" /><p className="text-sm text-gray-600 mt-2">En attente</p><p className="text-2xl font-bold text-secondary">{pending}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 flex space-x-8 px-6">
          <button onClick={() => setSelectedTab("invoices")} className={`py-4 border-b-2 font-medium ${selectedTab === "invoices" ? "border-primary text-primary" : "border-transparent text-gray-500"}`}>Factures</button>
          <button onClick={() => setSelectedTab("payments")} className={`py-4 border-b-2 font-medium ${selectedTab === "payments" ? "border-primary text-primary" : "border-transparent text-gray-500"}`}>Paiements</button>
        </div>
        <div className="p-6">
          {selectedTab === "invoices" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  {...invoice}
                  onView={() => openInvoicePdf(invoice.id)}
                  onDownload={() => openInvoicePdf(invoice.id, true)}
                  onPay={() => toast.info("Redirection vers la page de paiement...")}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">Historique vide.</div>
          )}
        </div>
      </div>
    </div>
  );
}
