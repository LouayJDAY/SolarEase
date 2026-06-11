import { z } from "zod";
import {
  emailSchema,
  nameSchema,
  optionalNameSchema,
  otpCodeSchema,
  passwordInstallerSchema,
  passwordLoginSchema,
  passwordRegisterSchema,
  phoneSchema,
  usernameSchema,
} from "./common";

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordLoginSchema,
});

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordRegisterSchema,
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otpCode: otpCodeSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: passwordRegisterSchema,
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const createInstallerSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordInstallerSchema,
});

export const updateProfileSchema = z.object({
  firstName: optionalNameSchema,
  lastName: optionalNameSchema,
  phone: z.string().trim().max(20, "Maximum 20 caractères.").optional(),
  company: z.string().trim().max(100, "Maximum 100 caractères.").optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type CreateInstallerFormValues = z.infer<typeof createInstallerSchema>;

export const inviteUserSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
  email: emailSchema,
  role: z.enum(["ADMIN", "INSTALLER"]),
});

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export { usernameSchema };
