import { CreditCard, Download, FileText } from "lucide-react";
import { motion } from "motion/react";

export type InvoiceStatus =
  | "PAYEE"
  | "EN_ATTENTE"
  | "RETARD"
  | "ANNULEE"
  | "DRAFT"
  | "SENT"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

interface InvoiceCardProps {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus | string;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onPay?: (id: string) => void;
}

const statusConfig: Record<InvoiceStatus, { label: string; color: string }> = {
  PAYEE: { label: "Payée", color: "bg-green-100 text-green-700" },
  EN_ATTENTE: { label: "En attente", color: "bg-orange-100 text-orange-700" },
  RETARD: { label: "En retard", color: "bg-red-100 text-red-700" },
  ANNULEE: { label: "Annulée", color: "bg-gray-100 text-gray-700" },
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  SENT: { label: "Envoyée", color: "bg-orange-100 text-orange-700" },
  PAID: { label: "Payée", color: "bg-green-100 text-green-700" },
  OVERDUE: { label: "En retard", color: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Annulée", color: "bg-gray-100 text-gray-700" },
};

function normalizeStatus(status: string): InvoiceStatus {
  switch ((status || "").toUpperCase()) {
    case "PAID":
      return "PAID";
    case "OVERDUE":
      return "OVERDUE";
    case "CANCELLED":
      return "CANCELLED";
    case "SENT":
      return "SENT";
    case "DRAFT":
      return "DRAFT";
    case "PAYEE":
      return "PAYEE";
    case "RETARD":
      return "RETARD";
    case "ANNULEE":
      return "ANNULEE";
    case "EN_ATTENTE":
      return "EN_ATTENTE";
    default:
      return "EN_ATTENTE";
  }
}

export function InvoiceCard({
  id,
  number,
  date,
  dueDate,
  amount,
  status,
  onView,
  onDownload,
  onPay,
}: InvoiceCardProps) {
  const normalizedStatus = normalizeStatus(status);
  const statusInfo = statusConfig[normalizedStatus];
  const canPay = normalizedStatus === "EN_ATTENTE" || normalizedStatus === "RETARD" || normalizedStatus === "SENT";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-secondary mb-1">Facture {number}</h3>
            <div className="text-sm text-gray-600 space-y-0.5">
              <p>Date: {date}</p>
              <p>Échéance: {dueDate}</p>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</div>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-sm text-gray-600 mb-1">Montant</p>
        <p className="text-2xl font-bold text-secondary">{amount.toLocaleString("fr-TN")} TND</p>
      </div>

      <div className="flex items-center space-x-2">
        {canPay && onPay && (
          <button
            onClick={() => onPay(id)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <CreditCard className="w-4 h-4" />
            <span>Payer maintenant</span>
          </button>
        )}
        {onView && (
          <button
            onClick={() => onView(id)}
            className={`${canPay ? "" : "flex-1"} px-4 py-2 bg-gray-100 text-secondary rounded-lg hover:bg-gray-200 transition-colors font-medium`}
          >
            Voir
          </button>
        )}
        {onDownload && (
          <button
            onClick={() => onDownload(id)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
