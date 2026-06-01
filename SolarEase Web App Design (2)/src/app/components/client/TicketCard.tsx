import { AlertCircle, CheckCircle, Clock, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

export type TicketStatus = "OUVERT" | "EN_COURS" | "RESOLU" | "FERME";
export type TicketPriority = "BASSE" | "MOYENNE" | "HAUTE" | "URGENTE";

interface TicketCardProps {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  lastUpdate: string;
  messageCount: number;
  onView?: (id: string) => void;
}

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: any }> = {
  OUVERT: { label: "Ouvert", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  EN_COURS: { label: "En cours", color: "bg-orange-100 text-orange-700", icon: Clock },
  RESOLU: { label: "Résolu", color: "bg-green-100 text-green-700", icon: CheckCircle },
  FERME: { label: "Fermé", color: "bg-gray-100 text-gray-700", icon: CheckCircle },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  BASSE: { label: "Basse", color: "text-gray-600" },
  MOYENNE: { label: "Moyenne", color: "text-blue-600" },
  HAUTE: { label: "Haute", color: "text-orange-600" },
  URGENTE: { label: "Urgente", color: "text-red-600" },
};

export function TicketCard({
  id,
  title,
  description,
  status,
  priority,
  lastUpdate,
  messageCount,
  onView,
}: TicketCardProps) {
  const statusInfo = statusConfig[status];
  const priorityInfo = priorityConfig[priority];
  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onView?.(id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-secondary mb-2 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex-shrink-0 ml-2`}>
          <StatusIcon className="w-3 h-3" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{lastUpdate}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3 h-3" />
            <span>{messageCount} messages</span>
          </div>
        </div>
        <div className={`text-xs font-medium ${priorityInfo.color}`}>{priorityInfo.label}</div>
      </div>
    </motion.div>
  );
}
