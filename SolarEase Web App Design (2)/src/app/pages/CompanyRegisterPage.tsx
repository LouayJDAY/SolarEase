import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export function CompanyRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    adminFirstName: "",
    adminLastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.companyName) {
      newErrors.companyName = "Le nom de l'entreprise est requis";
    }

    if (!formData.adminFirstName) {
      newErrors.adminFirstName = "Le prénom est requis";
    }

    if (!formData.adminLastName) {
      newErrors.adminLastName = "Le nom est requis";
    }

    if (!formData.email) {
      newErrors.email = "L'adresse email est requise";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'adresse email n'est pas valide";
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    // Mock: Create company with admin user (role: ADMIN, company_id: generated)
    console.log("Creating company:", {
      company: formData.companyName,
      admin: {
        firstName: formData.adminFirstName,
        lastName: formData.adminLastName,
        email: formData.email,
        role: "ADMIN"
      }
    });
    navigate("/verify");
  };

  return (
    <AuthLayout
      imageSrc="https://images.unsplash.com/photo-1720610784599-18c02b1cc9ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHNvbGFyJTIwcGFuZWwlMjBpbnN0YWxsZXIlMjB3b3JraW5nfGVufDF8fHx8MTc3MTg5MDYyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      tagline="Rejoignez les professionnels du solaire"
    >
      <div className="space-y-8">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl text-secondary mb-2">
            Créez votre Entreprise
          </h1>
          <p className="text-muted-foreground">
            Commencez votre essai gratuit - Vous serez administrateur
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nom de l'entreprise"
            type="text"
            placeholder="SolarPro SARL"
            value={formData.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            error={errors.companyName}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              type="text"
              placeholder="Jean"
              value={formData.adminFirstName}
              onChange={(e) => handleChange("adminFirstName", e.target.value)}
              error={errors.adminFirstName}
            />

            <Input
              label="Nom"
              type="text"
              placeholder="Dupont"
              value={formData.adminLastName}
              onChange={(e) => handleChange("adminLastName", e.target.value)}
              error={errors.adminLastName}
            />
          </div>

          <Input
            label="Email professionnel"
            type="email"
            placeholder="jean.dupont@solarpro.fr"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="Min. 8 caractères"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
            showPasswordToggle
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            placeholder="Retapez votre mot de passe"
            value={formData.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            showPasswordToggle
          />

          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => handleChange("acceptTerms", e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
              />
              <span className="text-sm text-muted-foreground group-hover:text-secondary transition-colors">
                J'accepte les{" "}
                <a href="#" className="text-primary hover:text-[#27AE60] underline">
                  conditions d'utilisation
                </a>{" "}
                et la{" "}
                <a href="#" className="text-primary hover:text-[#27AE60] underline">
                  politique de confidentialité
                </a>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="text-sm text-destructive ml-8">{errors.acceptTerms}</p>
            )}
          </div>

          <Button type="submit" fullWidth>
            Créer mon entreprise
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link 
              to="/" 
              className="text-primary hover:text-[#27AE60] font-medium transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
