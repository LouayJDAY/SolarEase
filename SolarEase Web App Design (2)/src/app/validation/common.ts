import { z } from "zod";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_TN_REGEX = /^\+216\s?\d{2}\s?\d{3}\s?\d{3}$/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "L'email est requis.")
  .regex(EMAIL_REGEX, "Veuillez saisir un email valide.");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Minimum 2 caractères.")
  .max(50, "Maximum 50 caractères.");

export const optionalNameSchema = z
  .string()
  .trim()
  .max(50, "Maximum 50 caractères.")
  .optional()
  .or(z.literal(""));

export const passwordLoginSchema = z
  .string()
  .min(1, "Le mot de passe est requis.")
  .min(6, "Minimum 6 caractères.");

export const passwordRegisterSchema = z
  .string()
  .min(1, "Le mot de passe est requis.")
  .min(6, "Minimum 6 caractères.");

export const passwordInstallerSchema = z
  .string()
  .min(1, "Le mot de passe est requis.")
  .min(8, "Minimum 8 caractères.");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Minimum 3 caractères.")
  .max(50, "Maximum 50 caractères.");

export const phoneSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => !val || val === "+216" || val === "+216 " || PHONE_TN_REGEX.test(val.replace(/\s+/g, " ").trim()),
    "Format attendu : +216 XX XXX XXX."
  );

export const requiredPhoneSchema = z
  .string()
  .trim()
  .min(1, "Le téléphone est requis.")
  .refine(
    (val) => PHONE_TN_REGEX.test(val.replace(/\s+/g, " ").trim()),
    "Format attendu : +216 XX XXX XXX."
  );

export const positiveNumberSchema = z.coerce
  .number({ invalid_type_error: "Valeur numérique requise." })
  .positive("Doit être supérieur à 0.");

export const optionalPositiveNumberSchema = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : v),
  z.coerce.number().positive("Doit être supérieur à 0.").optional()
);

export const latitudeSchema = z.coerce
  .number({ invalid_type_error: "Latitude invalide." })
  .min(-90, "Latitude entre -90 et 90.")
  .max(90, "Latitude entre -90 et 90.");

export const longitudeSchema = z.coerce
  .number({ invalid_type_error: "Longitude invalide." })
  .min(-180, "Longitude entre -180 et 180.")
  .max(180, "Longitude entre -180 et 180.");

export const inclinationSchema = z.coerce
  .number({ invalid_type_error: "Inclinaison invalide." })
  .min(0, "Inclinaison entre 0° et 90°.")
  .max(90, "Inclinaison entre 0° et 90°.");

export const otpCodeSchema = z
  .string()
  .trim()
  .length(6, "Le code OTP doit contenir 6 chiffres.")
  .regex(/^\d{6}$/, "Le code OTP doit contenir 6 chiffres.");

export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
