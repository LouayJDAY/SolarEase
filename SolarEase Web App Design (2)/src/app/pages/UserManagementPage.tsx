import React from "react";
import { UserPlus, Trash2, Edit, User, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../components/Button";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import authService, { InstallerOption } from "../services/authService";

interface InstallerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
}

const initialForm: InstallerFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  isActive: true,
};

export function UserManagementPage() {
  const { user } = useAuth();
  const [installers, setInstallers] = React.useState<InstallerOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingInstaller, setEditingInstaller] = React.useState<InstallerOption | null>(null);
  const [form, setForm] = React.useState<InstallerFormData>(initialForm);

  const isAdmin = user?.role === "ADMIN";

  const loadInstallers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await authService.getInstallers();
      setInstallers(data);
    } catch (err) {
      console.error("Erreur chargement installateurs", err);
      setError("Impossible de charger les installateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isAdmin) {
      loadInstallers();
    }
  }, [isAdmin, loadInstallers]);

  const openCreateModal = () => {
    setEditingInstaller(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (installer: InstallerOption) => {
    setEditingInstaller(installer);
    setForm({
      firstName: installer.firstName || "",
      lastName: installer.lastName || "",
      email: installer.email || "",
      phone: installer.phone || "",
      password: "",
      isActive: installer.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast.error("Prénom, nom et email sont obligatoires.");
      return;
    }
    if (!editingInstaller && form.password.trim().length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    try {
      setIsSaving(true);
      if (editingInstaller) {
        await authService.updateInstaller(editingInstaller.uuid, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password.trim() || undefined,
          isActive: form.isActive,
        });
        toast.success("Installateur modifié.");
      } else {
        await authService.createInstaller({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        });
        toast.success("Installateur ajouté.");
      }

      setIsModalOpen(false);
      setForm(initialForm);
      setEditingInstaller(null);
      await loadInstallers();
    } catch (err: any) {
      console.error("Erreur sauvegarde installateur", err);
      const message = err?.response?.data?.message || "Échec de l'opération.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInstaller = async (installerUuid: string) => {
    if (!confirm("Confirmer la suppression de cet installateur ?")) {
      return;
    }

    try {
      await authService.deleteInstaller(installerUuid);
      toast.success("Installateur supprimé.");
      await loadInstallers();
    } catch (err: any) {
      console.error("Erreur suppression installateur", err);
      const message = err?.response?.data?.message || "Impossible de supprimer l'installateur.";
      toast.error(message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
            Accès refusé. Cette page est réservée aux administrateurs.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl text-secondary">Gestion des Installateurs</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  CRUD complet des comptes installateurs
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={loadInstallers}>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Actualiser
                </Button>
                <Button onClick={openCreateModal}>
                <UserPlus className="w-5 h-5 mr-2" />
                Ajouter un installateur
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Vérification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date d'ajout
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        Chargement des installateurs...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : installers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        Aucun installateur trouvé.
                      </td>
                    </tr>
                  ) : installers.map((installer) => (
                    <tr key={installer.uuid} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {(installer.firstName || "?").charAt(0)}{(installer.lastName || "?").charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-secondary">
                              {installer.firstName} {installer.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{installer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {installer.isEmailVerified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Vérifié
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              En attente
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {installer.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(installer.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(installer)}
                            className="text-primary hover:text-[#27AE60] transition-colors p-2"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInstaller(installer.uuid)}
                            className="text-destructive hover:text-red-700 transition-colors p-2"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-muted-foreground">
                Total: {installers.length} installateur{installers.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-xl w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl text-secondary">
                {editingInstaller ? "Modifier l'installateur" : "Ajouter un installateur"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-1">Prénom</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-1">Nom</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-secondary mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-secondary mb-1">Téléphone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-secondary mb-1">
                  {editingInstaller ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder={editingInstaller ? "Laisser vide pour conserver" : "Minimum 8 caractères"}
                />
              </div>

              {editingInstaller && (
                <label className="flex items-center gap-2 text-sm text-secondary">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Compte actif
                </label>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}