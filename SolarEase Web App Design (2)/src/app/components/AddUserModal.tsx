import React, { useState } from "react";
import { X } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userData: { firstName: string; lastName: string; email: string; role: "ADMIN" | "INSTALLATEUR" }) => void;
}

export function AddUserModal({ isOpen, onClose, onAdd }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "INSTALLATEUR" as "ADMIN" | "INSTALLATEUR"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!formData.email) {
      newErrors.email = "L'adresse email est requise";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'adresse email n'est pas valide";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAdd(formData);
    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "INSTALLATEUR"
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "INSTALLATEUR"
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl text-secondary">
            Ajouter un employé
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Un email d'invitation sera envoyé à l'employé pour qu'il crée son mot de passe.
          </p>

          <Input
            label="Prénom"
            type="text"
            placeholder="Jean"
            value={formData.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            error={errors.firstName}
          />

          <Input
            label="Nom"
            type="text"
            placeholder="Dupont"
            value={formData.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            error={errors.lastName}
          />

          <Input
            label="Email professionnel"
            type="email"
            placeholder="jean.dupont@votreentreprise.fr"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
          />

          <div>
            <label className="block mb-2 text-sm text-secondary">
              Rôle
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="INSTALLATEUR"
                  checked={formData.role === "INSTALLATEUR"}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-secondary">Installateur</div>
                  <div className="text-xs text-muted-foreground">
                    Peut créer et gérer des projets
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="ADMIN"
                  checked={formData.role === "ADMIN"}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-secondary">Administrateur</div>
                  <div className="text-xs text-muted-foreground">
                    Accès complet + gestion des utilisateurs
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" fullWidth onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" fullWidth>
              Envoyer l'invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
