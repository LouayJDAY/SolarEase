import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Lock, Save, Edit2, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import authService from "../../services/authService";
import clientService from "../../services/clientService";
import { useAuth } from "../../context/AuthContext";
import { changePasswordSchema } from "../../validation/authSchemas";
import { clientMeUpdateSchema } from "../../validation/clientSchemas";
import { zodFieldErrors } from "../../validation/common";
import { getApiErrorMessage } from "../../utils/apiError";

export function ClientProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [authProfile, clientProfile] = await Promise.all([
          authService.getProfile(),
          clientService.getMyClientProfile().catch(() => null),
        ]);
        setFirstName(authProfile.firstName || "");
        setLastName(authProfile.lastName || "");
        setEmail(authProfile.email || "");
        setPhone(authProfile.phone || clientProfile?.phoneNumber || "");
        setAddress(clientProfile?.address || "");
      } catch {
        toast.error("Impossible de charger le profil");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    const parsed = clientMeUpdateSchema.safeParse({
      firstName,
      lastName,
      phoneNumber: phone,
      address,
    });
    if (!parsed.success) {
      toast.error(Object.values(zodFieldErrors(parsed.error)).join(" "));
      return;
    }
    try {
      setSaving(true);
      const updated = await authService.updateProfile({ firstName, lastName, phone });
      await clientService.updateMyClientProfile({
        firstName,
        lastName,
        phoneNumber: phone,
        address,
      });
      if (user) {
        updateUser({
          ...user,
          firstName: updated.firstName || firstName,
          lastName: updated.lastName || lastName,
          phone: updated.phone || phone,
        });
      }
      setIsEditing(false);
      toast.success("Profil mis à jour");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    const parsed = changePasswordSchema.safeParse({
      currentPassword: currentPw,
      newPassword: newPw,
      confirmPassword: confirmPw,
    });
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Données invalides.");
      return;
    }
    try {
      setChangingPassword(true);
      await authService.changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: confirmPw,
      });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setShowPasswordModal(false);
      toast.success("Mot de passe modifié");
    } catch (err: unknown) {
      setPasswordError(getApiErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Mon profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Enregistrement..." : "Enregistrer"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-secondary">
              {firstName} {lastName}
            </h2>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{phone || "—"}</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{address || "—"}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Prénom</label>
              <input
                disabled={!isEditing}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nom</label>
              <input
                disabled={!isEditing}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                disabled
                value={email}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Téléphone</label>
              <input
                disabled={!isEditing}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Adresse</label>
              <input
                disabled={!isEditing}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-secondary mb-2">Sécurité du compte</h3>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-secondary text-white rounded-lg"
        >
          <Lock className="w-4 h-4" />
          <span>Changer le mot de passe</span>
        </button>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-secondary">Changer le mot de passe</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {passwordError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mot de passe actuel</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
              >
                {changingPassword ? "Modification..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
