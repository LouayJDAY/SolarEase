import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import authService from "../services/authService";
import { registerSchema, type RegisterFormValues, usernameSchema } from "../validation/authSchemas";
import { getApiErrorMessage } from "../utils/apiError";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("token") ?? "";
  const inviteEmail = searchParams.get("email") ?? "";
  const inviteProjectId =
    searchParams.get("projectId") ?? searchParams.get("projectid") ?? "";
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);

  const loginInviteUrl =
    inviteToken
      ? `/login?${new URLSearchParams({
          token: inviteToken,
          ...(inviteEmail ? { email: inviteEmail } : {}),
          ...(inviteProjectId ? { projectId: inviteProjectId } : {}),
        }).toString()}`
      : "/login";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: inviteEmail,
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (inviteToken) {
      logout();
      sessionStorage.setItem("invitationToken", inviteToken);
    }
    if (inviteProjectId) sessionStorage.setItem("invitationProjectId", inviteProjectId);
  }, [inviteToken, inviteProjectId, logout]);

  useEffect(() => {
    if (!inviteToken || !inviteEmail) return;
    authService
      .emailExists(inviteEmail)
      .then(({ exists }) => {
        setAccountAlreadyExists(exists);
        // #region agent log
        fetch("http://127.0.0.1:7481/ingest/a2021df7-c138-4bb1-b24c-c5adc0b4a923", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "34125a" },
          body: JSON.stringify({
            sessionId: "34125a",
            runId: "invite-flow",
            hypothesisId: "H2",
            location: "RegisterPage.tsx:emailExists",
            message: "register page email probe",
            data: { exists, hasInviteToken: true, projectId: inviteProjectId || null },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      })
      .catch(() => setAccountAlreadyExists(false));
  }, [inviteToken, inviteEmail, inviteProjectId]);

  const onSubmit = handleSubmit(async (data) => {
    setGeneralError("");
    setIsLoading(true);
    try {
      const usernameCandidate = data.email.split("@")[0] || `${data.firstName}.${data.lastName}`;
      const usernameCheck = usernameSchema.safeParse(usernameCandidate);
      if (!usernameCheck.success) {
        setGeneralError("L'email ne permet pas de générer un identifiant valide (min. 3 caractères).");
        return;
      }

      const response = await authService.register({
        username: usernameCheck.data,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone?.trim() || undefined,
        password: data.password,
        userRole: "CLIENT",
      });

      navigate(`/verify-otp?${new URLSearchParams({ email: data.email }).toString()}`, {
        state: { message: response.message },
      });
    } catch (err: unknown) {
      const rawMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "";
      const apiMessage = getApiErrorMessage(err, "Une erreur est survenue lors de l'inscription.");
      const rawLower = rawMessage.toLowerCase();
      const apiLower = apiMessage.toLowerCase();
      const isExistingEmail =
        rawLower.includes("already registered") ||
        apiLower.includes("déjà enregistré") ||
        apiLower.includes("possède déjà un compte") ||
        apiLower.includes("installateur");
      if (isExistingEmail && inviteToken) {
        // #region agent log
        fetch("http://127.0.0.1:7481/ingest/a2021df7-c138-4bb1-b24c-c5adc0b4a923", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "34125a" },
          body: JSON.stringify({
            sessionId: "34125a",
            runId: "invite-flow",
            hypothesisId: "H3",
            location: "RegisterPage.tsx:onSubmit",
            message: "register blocked existing email",
            data: { rawMessage, apiMessage, isExistingEmail },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        const isInstallerConflict =
          rawLower.includes("installer") || apiLower.includes("installateur");
        setGeneralError(
          isInstallerConflict
            ? "Cet email est déjà utilisé par un compte installateur. Demandez à l'administrateur de changer l'email du client ou de supprimer le compte installateur en conflit."
            : "Cet email possède déjà un compte SolarEase. Connectez-vous pour accepter l'invitation et accéder à votre projet."
        );
      } else {
        setGeneralError(apiMessage);
      }
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <AuthLayout
      imageSrc="https://images.unsplash.com/photo-1509390449338-6875c4a62e35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xhciUyMHBhbmVscyUyMG9uJTIwYSUyMG1vZGVybiUyMGhvdXNlfGVufDF8fHx8MTc3MTg5MDYyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      tagline="Créez votre compte pour commencer votre projet solaire."
    >
      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl text-secondary mb-2">Inscription Client</h1>
          <p className="text-muted-foreground">
            Rejoignez SolarEase et prenez le contrôle de votre énergie.
          </p>
          {inviteToken && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {accountAlreadyExists
                ? `Votre fiche client a été créée pour le projet #${inviteProjectId || "…"}. Connectez-vous pour activer votre espace portail.`
                : `Vous avez été invité à créer votre espace client SolarEase${inviteProjectId ? ` pour le projet #${inviteProjectId}` : ""}.`}
            </div>
          )}
          {accountAlreadyExists && inviteToken && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-3">
              <p>
                Cet email possède déjà un compte SolarEase. La conversion admin a créé votre
                fiche projet — il reste à <strong>vous connecter</strong> pour lier le projet
                {inviteProjectId ? ` #${inviteProjectId}` : ""}.
              </p>
              <Link
                to={loginInviteUrl}
                className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:opacity-95"
              >
                Se connecter et accéder au projet
              </Link>
            </div>
          )}
        </div>
        {!accountAlreadyExists && (
        <form onSubmit={onSubmit} className="space-y-4">
          {generalError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm space-y-2">
              <p>{generalError}</p>
              {inviteToken &&
                generalError.includes("Connectez-vous pour accepter l'invitation") && (
                  <Link
                    to={loginInviteUrl}
                    className="inline-block text-primary font-medium hover:underline"
                  >
                    Se connecter avec ce compte
                  </Link>
                )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" {...register("firstName")} error={errors.firstName?.message} />
            <Input label="Nom" {...register("lastName")} error={errors.lastName?.message} />
          </div>
          <Input
            label="Adresse email"
            type="email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Téléphone (optionnel)"
            type="tel"
            placeholder="+216 98 123 456"
            {...register("phone")}
            error={errors.phone?.message}
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="Min. 6 caractères"
            {...register("password")}
            error={errors.password?.message}
            showPasswordToggle
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
            showPasswordToggle
          />
          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Création du compte..." : "Créer mon compte"}
          </Button>
        </form>
        )}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link
              to={loginInviteUrl}
              className="text-primary font-medium hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
