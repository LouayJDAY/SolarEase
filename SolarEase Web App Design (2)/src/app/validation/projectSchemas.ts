import { z } from "zod";
import {
  emailSchema,
  inclinationSchema,
  latitudeSchema,
  longitudeSchema,
  nameSchema,
  optionalPositiveNumberSchema,
  positiveNumberSchema,
} from "./common";

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, "Le nom du projet est requis."),
  clientId: z.union([
    z.coerce.number().int().positive("Sélectionnez un client."),
    z.string().min(1, "Sélectionnez un client.").transform((s) => parseInt(s, 10)),
  ]),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(500).optional(),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  availableArea: optionalPositiveNumberSchema,
  inclination: inclinationSchema.optional(),
  orientation: z.coerce.number().min(0).max(360).optional(),
  budget: optionalPositiveNumberSchema,
});

export const projectUpdateSchema = projectCreateSchema;

export const demandCreateSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(500).optional(),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  availableArea: optionalPositiveNumberSchema,
  inclination: inclinationSchema.optional(),
  orientation: z.coerce.number().min(0).max(360).optional(),
  budget: optionalPositiveNumberSchema,
});

export const publicDemandSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  subject: z.string().trim().min(1, "Le sujet est requis."),
  message: z.string().trim().min(10, "Minimum 10 caractères."),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^\+?[\d\s().-]{6,20}$/.test(val),
      "Numéro de téléphone invalide."
    ),
});

export const simulateurWizardSchema = z.object({
  propertyType: z.string().trim().min(1, "Sélectionnez un type de bien."),
  quarterlyBill: z.coerce.number().positive("Indiquez une facture trimestrielle valide."),
  roofArea: z.coerce.number().positive("Indiquez une surface de toiture valide."),
  region: z.string().trim().min(1, "Sélectionnez une région."),
});

export type ProjectCreateFormValues = z.infer<typeof projectCreateSchema>;
export type PublicDemandFormValues = z.infer<typeof publicDemandSchema>;
