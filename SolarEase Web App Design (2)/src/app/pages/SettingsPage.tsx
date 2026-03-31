import React, { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import authService from "../services/authService";
import {
  User,
  Shield,
  Building2,
  SlidersHorizontal,
  Bell,
  Plug,
  Camera,
  Eye,
  EyeOff,
  Upload,
  Check,
  AlertCircle,
  Download,
  ExternalLink,
  Headphones,
  X,
  ChevronDown,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════════════════════════ */

const GREEN = "#4CAF50";
const card =
  "bg-white rounded-xl p-6" as const;
const shadow = { boxShadow: "0 1px 3px rgba(0,0,0,0.06)" } as const;
const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5";
const inputCls =
  "w-full h-11 px-3.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] transition-colors";

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{ backgroundColor: on ? GREEN : "#D1D5DB" }}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-bold text-gray-900 mb-4">{children}</h3>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Tab definitions
   ═══════════════════════════════════════════════════════════════ */

const tabs = [
  { key: "profil", label: "Profil", icon: User },
  { key: "securite", label: "Sécurité", icon: Shield },
  { key: "entreprise", label: "Entreprise", icon: Building2 },
  { key: "preferences", label: "Préférences", icon: SlidersHorizontal },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "integrations", label: "Intégrations", icon: Plug },
] as const;

type TabKey = (typeof tabs)[number]["key"];

/* ═══════════════════════════════════════════════════════════════
   Toast
   ═══════════════════════════════════════════════════════════════ */

function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl animate-[slideUp_0.3s_ease]">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: GREEN }}
      >
        <Check className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROFIL TAB
   ═══════════════════════════════════════════════════════════════ */

function ProfilTab({ onSave }: { onSave: () => void }) {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "SE";

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await authService.updateProfile({ firstName, lastName, phone });
      updateUser({ ...user!, firstName: updated.firstName || firstName, lastName: updated.lastName || lastName, phone: updated.phone || phone });
      onSave();
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={card} style={shadow}>
      <SectionTitle>Informations personnelles</SectionTitle>

      {/* Avatar row */}
      <div className="flex items-center gap-5 mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
          style={{ backgroundColor: GREEN }}
        >
          {initials}
        </div>
        <div>
          <button
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Camera className="w-4 h-4 text-gray-500" />
            Changer la photo
          </button>
          <p className="text-xs text-gray-400 mt-1.5">
            JPG, PNG. Max 2 MB.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Row – Prénom / Nom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Prénom</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nom</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className={labelCls}>Adresse email</label>
          <input
            type="email"
            value={email}
            disabled
            className={`${inputCls} bg-gray-50 cursor-not-allowed`}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Cet email est utilisé pour la connexion et les notifications.
          </p>
        </div>

        {/* Phone + Fonction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Téléphone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Fonction</label>
            <input defaultValue="Installateur Pro" disabled className={`${inputCls} bg-gray-50 cursor-not-allowed`} />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-gray-100">
        <button className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          style={{ backgroundColor: GREEN }}
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SÉCURITÉ TAB
   ═══════════════════════════════════════════════════════════════ */

function SecuriteTab({ onSave }: { onSave: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [twoFA, setTwoFA] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const strength =
    newPw.length === 0
      ? 0
      : newPw.length < 6
      ? 1
      : newPw.length < 10
      ? 2
      : 3;
  const strengthLabel = ["", "Faible", "Moyen", "Fort"][strength];
  const strengthColor = ["#E0E0E0", "#EF5350", "#FF9800", GREEN][strength];
  const strengthWidth = [0, 33, 66, 100][strength];

  const handleChangePassword = async () => {
    setError("");
    if (newPw !== confirmPw) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPw.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    try {
      setSaving(true);
      await authService.changePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors du changement de mot de passe");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Card 1 – Password */}
      <div className={card} style={shadow}>
        <SectionTitle>Changer le mot de passe</SectionTitle>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="space-y-4">
          {/* Current */}
          <div>
            <label className={labelCls}>Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New */}
          <div>
            <label className={labelCls}>Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* Strength bar */}
            {newPw.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${strengthWidth}%`,
                      backgroundColor: strengthColor,
                    }}
                  />
                </div>
                <p
                  className="text-xs font-medium mt-1"
                  style={{ color: strengthColor }}
                >
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className={labelCls}>Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50"
            style={{ backgroundColor: GREEN }}
          >
            {saving ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </div>
      </div>

      {/* Card 2 – Session */}
      <div className={card} style={shadow}>
        <SectionTitle>Session et accès</SectionTitle>
        <div className="space-y-5">
          {/* 2FA */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Authentification à deux facteurs (2FA)
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Ajoutez une couche de sécurité supplémentaire
              </p>
            </div>
            <Toggle on={twoFA} onChange={() => setTwoFA(!twoFA)} />
          </div>

          <hr className="border-gray-100" />

          {/* Logout all */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Se déconnecter de tous les appareils
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Fermer toutes les sessions actives
              </p>
            </div>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-500 hover:bg-red-50 transition-colors">
              Déconnecter tout
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Last login */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            Dernière connexion : 02/03/2026 à 02:53 depuis Tunis
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ENTREPRISE TAB
   ═══════════════════════════════════════════════════════════════ */

function EntrepriseTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-5">
      <div className={card} style={shadow}>
        <SectionTitle>Informations entreprise</SectionTitle>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nom de l'entreprise</label>
            <input
              defaultValue="SolarEase Installations"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Matricule fiscal</label>
              <input placeholder="Ex: 1234567A/B/C/000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Site web</label>
              <input
                placeholder="https://www.example.com"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Adresse siège</label>
            <input
              placeholder="Rue, numéro, immeuble..."
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ville</label>
              <input placeholder="Tunis" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Code postal</label>
              <input placeholder="1000" className={inputCls} />
            </div>
          </div>

          {/* Logo upload */}
          <div>
            <label className={labelCls}>Logo de l'entreprise</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#4CAF50]/40 hover:bg-green-50/20 transition-colors">
              <Upload className="w-5 h-5 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                Glissez ou{" "}
                <span style={{ color: GREEN }}>cliquez pour parcourir</span>
              </p>
            </div>
          </div>

          {/* Signature */}
          <div>
            <label className={labelCls}>Signature email</label>
            <textarea
              rows={3}
              placeholder="Signature qui apparaîtra dans les emails envoyés..."
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={onSave}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: GREEN }}
          >
            Enregistrer
          </button>
        </div>
      </div>

      {/* Paramètres commerciaux */}
      <div className={card} style={shadow}>
        <SectionTitle>Paramètres commerciaux</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Devise</label>
            <select className={`${inputCls} appearance-none`}>
              <option>TND - Dinar Tunisien</option>
              <option>EUR - Euro</option>
              <option>USD - Dollar US</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>TVA par défaut (%)</label>
            <input type="number" defaultValue={19} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Unité de puissance</label>
            <select className={`${inputCls} appearance-none`}>
              <option>kWc</option>
              <option>Wc</option>
              <option>MWc</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRÉFÉRENCES TAB
   ═══════════════════════════════════════════════════════════════ */

function PreferencesTab() {
  const [aiRecommendation, setAiRecommendation] = useState(true);

  return (
    <div className="space-y-5">
      <div className={card} style={shadow}>
        <SectionTitle>Préférences d'interface</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Langue</label>
            <select className={`${inputCls} appearance-none`}>
              <option>Français</option>
              <option>English</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Thème</label>
            <div className="flex gap-2">
              <button
                className="flex-1 h-11 rounded-lg text-sm font-medium border-2 transition-colors"
                style={{ borderColor: GREEN, color: GREEN, backgroundColor: "#E8F5E9" }}
              >
                ☀ Clair
              </button>
              <button
                className="flex-1 h-11 rounded-lg text-sm font-medium border border-gray-200 text-gray-400 cursor-not-allowed relative overflow-hidden"
                disabled
              >
                🌙 Sombre
                <span className="absolute top-1 right-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">
                  Bientôt
                </span>
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Format de date</label>
            <select className={`${inputCls} appearance-none`}>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Format des nombres</label>
            <select className={`${inputCls} appearance-none`}>
              <option>1 234,56</option>
              <option>1,234.56</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Vue dashboard par défaut</label>
            <select className={`${inputCls} appearance-none`}>
              <option>Carte + Projets récents</option>
              <option>Graphiques uniquement</option>
              <option>KPIs + Actions rapides</option>
            </select>
          </div>
        </div>
      </div>

      <div className={card} style={shadow}>
        <SectionTitle>Préférences de dimensionnement</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Inclinaison panneaux par défaut</label>
            <div className="relative">
              <input defaultValue="30" type="number" className={`${inputCls} pr-10`} />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">°</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Pertes par défaut</label>
            <div className="relative">
              <input defaultValue="14" type="number" className={`${inputCls} pr-10`} />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Prix électricité par défaut</label>
            <div className="relative">
              <input
                defaultValue="0.280"
                type="number"
                step="0.001"
                className={`${inputCls} pr-20`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                TND/kWh
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between md:col-span-1">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Recommandations IA
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Utiliser par défaut
              </p>
            </div>
            <Toggle
              on={aiRecommendation}
              onChange={() => setAiRecommendation(!aiRecommendation)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATIONS TAB
   ═══════════════════════════════════════════════════════════════ */

function NotificationsTab({ onSave }: { onSave: () => void }) {
  const [channels, setChannels] = useState({
    email: true,
    inApp: true,
    sms: false,
  });
  const [events, setEvents] = useState({
    newProject: true,
    dimDone: true,
    pdfReady: false,
    quoteExpiring: true,
    inactiveClient: false,
  });

  const toggleEvent = (key: keyof typeof events) =>
    setEvents((p) => ({ ...p, [key]: !p[key] }));

  const allOn = () =>
    setEvents({
      newProject: true,
      dimDone: true,
      pdfReady: true,
      quoteExpiring: true,
      inactiveClient: true,
    });

  const eventRows: { key: keyof typeof events; label: string; desc: string }[] = [
    { key: "newProject", label: "Nouveau projet créé", desc: "Notification à chaque nouveau projet" },
    { key: "dimDone", label: "Dimensionnement terminé", desc: "Quand une étude est prête" },
    { key: "pdfReady", label: "Rapport PDF généré", desc: "Quand un rapport est disponible" },
    { key: "quoteExpiring", label: "Alerte devis expirant", desc: "Devis arrivant à échéance" },
    { key: "inactiveClient", label: "Rappel client inactif 30 jours", desc: "Relance automatique" },
  ];

  return (
    <div className="space-y-5">
      {/* Channels */}
      <div className={card} style={shadow}>
        <SectionTitle>Canaux de notification</SectionTitle>
        <div className="space-y-4">
          {/* Email */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={channels.email}
              onChange={() =>
                setChannels((p) => ({ ...p, email: !p.email }))
              }
              className="w-4.5 h-4.5 rounded border-gray-300 accent-[#4CAF50]"
            />
            <span className="text-sm text-gray-900">Email</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={channels.inApp}
              onChange={() =>
                setChannels((p) => ({ ...p, inApp: !p.inApp }))
              }
              className="w-4.5 h-4.5 rounded border-gray-300 accent-[#4CAF50]"
            />
            <span className="text-sm text-gray-900">
              Notifications in-app
            </span>
          </label>
          <label className="flex items-center gap-3 opacity-50 cursor-not-allowed">
            <input type="checkbox" disabled className="w-4.5 h-4.5 rounded border-gray-300" />
            <span className="text-sm text-gray-900">SMS</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">
              Bientôt
            </span>
          </label>
        </div>
      </div>

      {/* Events */}
      <div className={card} style={shadow}>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Événements</SectionTitle>
          <button
            onClick={allOn}
            className="text-xs font-medium hover:underline"
            style={{ color: GREEN }}
          >
            Tout activer
          </button>
        </div>
        <div className="space-y-1">
          {eventRows.map((ev) => (
            <div
              key={ev.key}
              className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{ev.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ev.desc}</p>
              </div>
              <Toggle
                on={events[ev.key]}
                onChange={() => toggleEvent(ev.key)}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={onSave}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
            style={{ backgroundColor: GREEN }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INTÉGRATIONS TAB
   ═══════════════════════════════════════════════════════════════ */

function IntegrationsTab() {
  const [provider, setProvider] = useState("ollama");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [pvgisStatus] = useState<"ok" | "fail">("ok");

  return (
    <div className="space-y-5">
      {/* AI */}
      <div className={card} style={shadow}>
        <SectionTitle>Intelligence Artificielle</SectionTitle>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Fournisseur IA</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="ollama">Ollama (local)</option>
              <option value="mistral">Mistral API (cloud)</option>
            </select>
          </div>

          {provider === "mistral" && (
            <div>
              <label className={labelCls}>Clé API</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Statut :</span>
            {provider === "ollama" ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                Connecté
              </span>
            ) : apiKey ? (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                Connecté
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Non connecté
              </span>
            )}
          </div>
        </div>
      </div>

      {/* API externes */}
      <div className={card} style={shadow}>
        <SectionTitle>API externes</SectionTitle>
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">PVGIS v5.2</p>
              <p className="text-xs text-gray-500">
                Données d'irradiation solaire européenne
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={
                pvgisStatus === "ok"
                  ? { backgroundColor: "#E8F5E9", color: "#2E7D32" }
                  : { backgroundColor: "#FFEBEE", color: "#C62828" }
              }
            >
              <Check className="w-3 h-3" />
              Actif
            </span>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              Tester la connexion
            </button>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className={card} style={shadow}>
        <SectionTitle>Export & sauvegarde</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exporter mes données (CSV)
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Télécharger sauvegarde JSON
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUMMARY PANEL (sticky right)
   ═══════════════════════════════════════════════════════════════ */

function SummaryPanel() {
  return (
    <div
      className={`${card} sticky top-24`}
      style={shadow}
    >
      <h3 className="text-sm font-bold text-gray-900 mb-4">Résumé du compte</h3>
      <div className="space-y-3">
        {[
          { label: "Plan", value: "Pro", badge: true },
          { label: "Projets actifs", value: "5" },
          { label: "Clients", value: "8" },
          { label: "Dernière sauvegarde", value: "Aujourd'hui, 02:40" },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{r.label}</span>
            {r.badge ? (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
              >
                {r.value}
              </span>
            ) : (
              <span className="font-medium text-gray-900">{r.value}</span>
            )}
          </div>
        ))}
      </div>
      <button
        className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors hover:bg-green-50"
        style={{ borderColor: GREEN, color: GREEN }}
      >
        <Headphones className="w-4 h-4" />
        Contacter le support
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
   ═══════════════════════════════════════════════════════════════ */

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profil");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = () => {
    setToast("Paramètres enregistrés avec succès");
    setTimeout(() => setToast(null), 3500);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "profil":
        return <ProfilTab onSave={showToast} />;
      case "securite":
        return <SecuriteTab onSave={showToast} />;
      case "entreprise":
        return <EntrepriseTab onSave={showToast} />;
      case "preferences":
        return <PreferencesTab />;
      case "notifications":
        return <NotificationsTab onSave={showToast} />;
      case "integrations":
        return <IntegrationsTab />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F6F7F9" }}>
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-5">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez votre compte, sécurité et préférences de l'application
            </p>
          </div>

          {/* Body: tab nav + content + summary */}
          <div className="flex gap-6">
            {/* Left mini-nav */}
            <nav
              className="w-52 shrink-0 bg-white rounded-xl p-2 self-start sticky top-24 hidden lg:block"
              style={shadow}
            >
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                      active
                        ? "text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    style={active ? { backgroundColor: GREEN } : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile tab chips (scroll) */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 -mx-6 px-6 mb-2 w-[calc(100%+3rem)]">
              {tabs.map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 ${
                      active ? "text-white" : "bg-white text-gray-600"
                    }`}
                    style={active ? { backgroundColor: GREEN } : undefined}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Centre content */}
            <div className="flex-1 min-w-0">{renderTab()}</div>

            {/* Right summary (desktop only) */}
            <div className="w-64 shrink-0 hidden xl:block">
              <SummaryPanel />
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
