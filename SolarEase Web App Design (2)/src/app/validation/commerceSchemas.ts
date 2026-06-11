import { z } from "zod";
import { emailSchema, nameSchema } from "./common";

export const quoteFormSchema = z.object({
  projectId: z.coerce.number().int().positive("Projet requis."),
  laborCost: z.coerce.number().min(0, "Coût main-d'œuvre invalide."),
  materialsCost: z.coerce.number().min(0, "Coût matériaux invalide."),
  tax: z.coerce.number().min(0).max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const invoiceUpdateSchema = z.object({
  date: z.string().min(1, "La date est requise."),
  dueDate: z.string().min(1, "La date d'échéance est requise."),
  subtotal: z.coerce.number().min(0, "Montant invalide."),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const supportTicketSchema = z.object({
  subject: z.string().trim().min(1, "Le sujet est requis.").max(255, "Maximum 255 caractères."),
  description: z.string().trim().min(1, "La description est requise.").max(5000, "Maximum 5000 caractères."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

export const equipmentCreateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  type: z.string().min(1, "Le type est requis."),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  nominalPower: z.coerce.number().positive().optional(),
  price: z.coerce.number().min(0).optional(),
});

export const quoteRejectSchema = z.object({
  rejectionReason: z.string().trim().max(2000).optional(),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;
export type InvoiceUpdateFormValues = z.infer<typeof invoiceUpdateSchema>;
export type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;
