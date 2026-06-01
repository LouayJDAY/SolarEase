import { AlertCircle, CheckCircle, Clock, Download, Eye, FileText, Share2 } from "lucide-react";
import { motion } from "motion/react";

export type DocumentType = "DEVIS" | "CONTRAT" | "FACTURE" | "RAPPORT" | "CERTIFICAT" | "AUTRE";
export type DocumentStatus = "SIGNE" | "EN_ATTENTE" | "EXPIRE" | "VALIDE";

interface DocumentCardProps {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  date: string;
  size: string;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
}

const typeLabels: Record<DocumentType, string> = {
  DEVIS: "Devis",
  CONTRAT: "Contrat",
  FACTURE: "Facture",
  RAPPORT: "Rapport",
  CERTIFICAT: "Certificat",
  AUTRE: "Autre",
};

const statusConfig: Record<DocumentStatus, { label: string; color: string; icon: any }> = {
  SIGNE: { label: "Signé", color: "bg-green-100 text-green-700", icon: CheckCircle },
  EN_ATTENTE: { label: "En attente", color: "bg-orange-100 text-orange-700", icon: Clock },
  EXPIRE: { label: "Expiré", color: "bg-red-100 text-red-700", icon: AlertCircle },
  VALIDE: { label: "Valide", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
};

export function DocumentCard({
  id,
  name,
  type,
  status,
  date,
  size,
  onView,
  onDownload,
  onShare,
}: DocumentCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-secondary mb-1 truncate group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">{typeLabels[type]}</span>
              <span>{date}</span>
              <span>{size}</span>
            </div>
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {onView && (
          <button
            onClick={() => onView(id)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span>Voir</span>
          </button>
        )}
        {onDownload && (
          <button
            onClick={() => onDownload(id)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-secondary rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger</span>
          </button>
        )}
        {onShare && (
          <button
            onClick={() => onShare(id)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Partager"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
