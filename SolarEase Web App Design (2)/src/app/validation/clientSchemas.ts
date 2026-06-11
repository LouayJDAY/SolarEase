import { z } from "zod";
import { emailSchema, nameSchema, phoneSchema } from "./common";

export const clientCreateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().trim().max(500, "Maximum 500 caractères.").optional(),
  city: z.string().trim().max(100, "Maximum 100 caractères.").optional(),
  postalCode: z.string().trim().max(20, "Maximum 20 caractères.").optional(),
  clientType: z.enum(["Particulier", "Entreprise"]).optional(),
  notes: z.string().trim().max(1000, "Maximum 1000 caractères.").optional(),
});

export const clientUpdateSchema = clientCreateSchema;

export const clientMeUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phoneNumber: z.string().trim().max(20, "Maximum 20 caractères.").optional(),
  address: z.string().trim().max(500, "Maximum 500 caractères.").optional(),
});

export type ClientCreateFormValues = z.infer<typeof clientCreateSchema>;
