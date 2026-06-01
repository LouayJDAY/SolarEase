import React from "react";
import type { QuoteStatus } from "../services/quoteService";

interface Props {
  status: QuoteStatus;
}

const config: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Brouillon",
    className: "bg-gray-100 text-gray-700",
  },
  SENT: {
    label: "Envoyé",
    className: "bg-blue-100 text-blue-700",
  },
  ACCEPTED: {
    label: "Accepté",
    className: "bg-green-100 text-green-700",
  },
  REJECTED: {
    label: "Refusé",
    className: "bg-red-100 text-red-700",
  },
  EXPIRED: {
    label: "Expiré",
    className: "bg-orange-100 text-orange-700",
  },
  INVOICED: {
    label: "Facturé",
    className: "bg-purple-100 text-purple-700",
  },
};

export function QuoteStatusBadge({ status }: Props) {
  const { label, className } = config[status] ?? config.DRAFT;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
