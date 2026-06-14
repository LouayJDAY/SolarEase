import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { Sparkles } from "lucide-react";
import authService from "../services/authService";
import { loginSchema, type LoginFormValues } from "../validation/authSchemas";
import { getApiErrorMessage } from "../utils/apiError";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("token") ?? sessionStorage.getItem("invitationToken") ?? "";
  const inviteEmail = searchParams.get("email") ?? "";
  const inviteProjectId =
    searchParams.get("projectId") ?? searchParams.get("projectid") ?? sessionStorage.getItem("invitationProjectId") ?? "";
  const { login, isAuthenticated } = useAuth();
  const [generalError, setGeneralError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [checkingInvite, setCheckingInvite] = React.useState(Boolean(inviteToken && inviteEmail));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: inviteEmail, password: "" },
  });

  React.useEffect(() => {
    if (inviteToken) sessionStorage.setItem("invitationToken", inviteToken);
    if (inviteProjectId) sessionStorage.setItem("invitationProjectId", inviteProjectId);
  }, [inviteToken, inviteProjectId]);

  /** Ancien lien /login d'une invitation : si le compte n'existe plus, aller à l'inscription. */
  React.useEffect(() => {
    if (!inviteToken || !inviteEmail) {
      setCheckingInvite(false);
      return;
    }
    let cancelled = false;
    authService
      .emailExists(inviteEmail)
      .then(({ exists }) => {
        if (cancelled) return;
        if (!exists) {
          const params = new URLSearchParams({
            token: inviteToken,
            email: inviteEmail,
          });
          if (inviteProjectId) params.set("projectId", inviteProjectId);
          navigate(`/register?${params.toString()}`, { replace: true });
          return;
        }
        setCheckingInvite(false);
      })
      .catch(() => {
        if (!cancelled) {
          const params = new URLSearchParams({
            token: inviteToken,
            email: inviteEmail,
          });
          if (inviteProjectId) params.set("projectId", inviteProjectId);
          navigate(`/register?${params.toString()}`, { replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inviteToken, inviteEmail, inviteProjectId, navigate]);

  const getDashboardPath = (role?: string) => {
    if (role === "CLIENT") return "/client/dashboard";
    if (role === "INSTALLER" || role === "ADMIN") return "/installer/dashboard";
    return "/dashboard";
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      try {
        const stored = localStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        navigate(getDashboardPath(parsed?.role));
      } catch {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setGeneralError("");
    setIsLoading(true);
    try {
      const token = inviteToken || sessionStorage.getItem("invitationToken") || undefined;
      await login(email, password, token);
      sessionStorage.removeItem("invitationToken");
      sessionStorage.removeItem("invitationProjectId");
      try {
        const stored = localStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        navigate(getDashboardPath(parsed?.role));
      } catch {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const apiMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "";
      const notFound =
        status === 404 ||
        apiMessage.toLowerCase().includes("not found") ||
        apiMessage.toLowerCase().includes("introuvable");

      if (inviteToken && notFound) {
        const params = new URLSearchParams({
          token: inviteToken,
          email: inviteEmail || email,
        });
        if (inviteProjectId) params.set("projectId", inviteProjectId);
        navigate(`/register?${params.toString()}`, { replace: true });
        return;
      }

      const message = getApiErrorMessage(
        err,
        (err as Error)?.message === "Network Error"
          ? "Impossible de joindre l'API. Verifiez que le backend tourne (docker compose up)."
          : "Email ou mot de passe incorrect"
      );
      setGeneralError(message);
    } finally {
      setIsLoading(false);
    }
  });

  const registerLink = inviteToken
    ? `/register?${new URLSearchParams({
        token: inviteToken,
        ...(inviteEmail ? { email: inviteEmail } : {}),
        ...(inviteProjectId ? { projectId: inviteProjectId } : {}),
      }).toString()}`
    : "/register";

  if (checkingInvite) {
    return (
      <AuthLayout
        imageSrc="https://images.unsplash.com/photo-1726795867801-63c0a37b80c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xhciUyMHBhbmVscyUyMG1vZGVybiUyMHJvb2YlMjBpbnN0YWxsYXRpb258ZW58MXx8fHwxNzcxODkwNjI1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
        tagline="Dimensionnez vos projets en un clic"
      >
        <div className="text-center py-12 text-muted-foreground">Vérification de votre invitation…</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      imageSrc="https://images.unsplash.com/photo-1726795867801-63c0a37b80c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xhciUyMHBhbmVscyUyMG1vZGVybiUyMHJvb2YlMjBpbnN0YWxsYXRpb258ZW58MXx8fHwxNzcxODkwNjI1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      tagline="Dimensionnez vos projets en un clic"
    >
      <div className="space-y-8">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-4 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Connexion sécurisée
          </div>
          <h1 className="text-3xl text-secondary mb-2">Bienvenue sur SolarEase</h1>
          <p className="text-muted-foreground">Connectez-vous pour accéder à votre espace</p>
          {inviteToken && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Vous avez été invité à rejoindre votre espace client SolarEase
              {inviteProjectId ? ` pour le projet #${inviteProjectId}` : ""}.
              Connectez-vous avec le compte associé à cette invitation.
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {generalError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {generalError}
            </div>
          )}

          <Input
            label="Adresse email"
            type="email"
            placeholder="votre@email.com"
            {...register("email")}
            error={errors.email?.message}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
            showPasswordToggle
          />

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas de compte ?{" "}
            <Link to={registerLink} className="text-primary font-medium hover:underline">
              Inscrivez-vous
            </Link>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Vous êtes installateur ou entreprise ?{" "}
            <Link to="/company-register" className="text-primary font-medium hover:underline">
              Enregistrez votre entreprise
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
