import React, { useState } from "react";
import { User, Mail, Phone, MapPin, Lock, Save, Edit2 } from "lucide-react";
import { toast } from "sonner";

export function ClientProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "Ahmed",
    lastName: "Ben Ali",
    email: "ahmed.benali@example.com",
    phone: "+216 98 123 456",
    address: "12 Rue de la République",
    city: "Tunis",
    postalCode: "1002",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Mon profil</h1>
          <p className="text-gray-600">Gérez vos informations personnelles</p>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg">
            <Edit2 className="w-4 h-4" />
            <span>Modifier</span>
          </button>
        ) : (
          <button onClick={() => { setIsEditing(false); toast.success("Profil mis à jour"); }} className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg">
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><User className="w-12 h-12 text-primary" /></div>
            <h2 className="text-xl font-bold text-secondary">{profile.firstName} {profile.lastName}</h2>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm">
            <div className="flex items-center space-x-3"><Mail className="w-4 h-4 text-gray-400" /><span>{profile.email}</span></div>
            <div className="flex items-center space-x-3"><Phone className="w-4 h-4 text-gray-400" /><span>{profile.phone}</span></div>
            <div className="flex items-center space-x-3"><MapPin className="w-4 h-4 text-gray-400" /><span>{profile.city}, {profile.postalCode}</span></div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input disabled={!isEditing} value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="px-4 py-3 border border-gray-300 rounded-lg" />
          <input disabled={!isEditing} value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="px-4 py-3 border border-gray-300 rounded-lg" />
          <input disabled={!isEditing} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="px-4 py-3 border border-gray-300 rounded-lg" />
          <input disabled={!isEditing} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="px-4 py-3 border border-gray-300 rounded-lg" />
          <input disabled={!isEditing} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg" />
          <input disabled={!isEditing} value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="px-4 py-3 border border-gray-300 rounded-lg" />
          <input disabled={!isEditing} value={profile.postalCode} onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })} className="px-4 py-3 border border-gray-300 rounded-lg" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-secondary mb-2">Sécurité du compte</h3>
        <button className="flex items-center space-x-2 px-6 py-3 bg-secondary text-white rounded-lg">
          <Lock className="w-4 h-4" />
          <span>Changer le mot de passe</span>
        </button>
      </div>
    </div>
  );
}
