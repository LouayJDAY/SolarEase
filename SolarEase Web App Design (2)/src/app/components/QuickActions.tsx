import React from "react";
import { FileText, Calculator, UserPlus, Zap } from "lucide-react";

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  color?: string;
}

function QuickActionButton({ icon, title, description, onClick, color = "primary" }: QuickActionButtonProps) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
    accent: "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white",
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      className="group bg-white border-2 border-gray-200 hover:border-primary rounded-lg p-6 text-left transition-all hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${colorClasses[color as keyof typeof colorClasses] || colorClasses.primary}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-secondary mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function QuickActions() {
  const handleNewStudy = () => {
    console.log("Lancer une nouvelle étude");
  };

  const handleQuickQuote = () => {
    console.log("Générer un devis rapide");
  };

  const handleAddClient = () => {
    console.log("Ajouter un client");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-secondary">Actions Rapides</h3>
        <p className="text-sm text-muted-foreground mt-1">Accédez rapidement aux fonctions principales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionButton
          icon={<Zap className="w-6 h-6" />}
          title="Nouvelle Étude"
          description="Lancer une étude de dimensionnement"
          onClick={handleNewStudy}
          color="primary"
        />
        <QuickActionButton
          icon={<Calculator className="w-6 h-6" />}
          title="Devis Rapide"
          description="Générer un devis en quelques clics"
          onClick={handleQuickQuote}
          color="accent"
        />
        <QuickActionButton
          icon={<UserPlus className="w-6 h-6" />}
          title="Ajouter un Client"
          description="Créer une fiche client"
          onClick={handleAddClient}
          color="blue"
        />
      </div>
    </div>
  );
}
