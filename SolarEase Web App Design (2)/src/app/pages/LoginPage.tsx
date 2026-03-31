import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      try {
        const stored = localStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        navigate(parsed?.role === "CLIENT" ? "/client/dashboard" : "/dashboard");
      } catch {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "L'adresse email est requise";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "L'adresse email n'est pas valide";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login(email, password);
      try {
        const stored = localStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        navigate(parsed?.role === "CLIENT" ? "/client/dashboard" : "/dashboard");
      } catch {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Email ou mot de passe incorrect";
      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      imageSrc="https://images.unsplash.com/photo-1726795867801-63c0a37b80c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xhciUyMHBhbmVscyUyMG1vZGVybiUyMHJvb2YlMjBpbnN0YWxsYXRpb258ZW58MXx8fHwxNzcxODkwNjI1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      tagline="Dimensionnez vos projets en un clic"
    >
      <div className="space-y-8">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl text-secondary mb-2">
            Bienvenue sur SolarEase
          </h1>
          <p className="text-muted-foreground">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          <Input
            label="Adresse email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            showPasswordToggle
          />

          <Button type="submit" fullWidth disabled={isLoading}>
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Problème de connexion ?{" "}
            <span className="font-medium text-secondary">
              Contactez votre administrateur SolarEase.
            </span>
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Aperçu client :{" "}
            <Link to="/client/dashboard" className="text-primary font-medium hover:underline">
              ouvrir l'espace client
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}