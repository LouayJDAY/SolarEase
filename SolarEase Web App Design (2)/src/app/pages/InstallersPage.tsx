import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  LayoutGrid,
  List,
  Eye,
  Pencil,
  Trash2,
  Plus,
  HardHat,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import {
  InstallerFormModal,
  InstallerFormValues,
} from "../components/InstallerFormModal";
import { useAuth } from "../context/AuthContext";
import authService, { InstallerOption } from "../services/authService";
import { getApiErrorMessage } from "../utils/apiError";

type StatusFilter = "all" | "active" | "inactive" | "verified";

const tabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "active", label: "Actifs" },
  { key: "inactive", label: "Inactifs" },
  { key: "verified", label: "Vérifiés" },
];

function initials(installer: InstallerOption) {
  const a = installer.firstName?.charAt(0) ?? "?";
  const b = installer.lastName?.charAt(0) ?? "?";
  return `${a}${b}`.toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function InstallersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [installers, setInstallers] = useState<InstallerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailInstaller, setDetailInstaller] = useState<InstallerOption | null>(null);
  const [editingInstaller, setEditingInstaller] = useState<InstallerOption | null>(null);

  const loadInstallers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authService.getInstallers();
      setInstallers(data);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err, "Impossible de charger les installateurs."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadInstallers();
  }, [isAdmin, loadInstallers]);

  const stats = useMemo(() => {
    const total = installers.length;
    const active = installers.filter((i) => i.isActive).length;
    const verified = installers.filter((i) => i.isEmailVerified).length;
    return { total, active, inactive: total - active, verified };
  }, [installers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return installers.filter((i) => {
      const matchSearch =
        !q ||
        `${i.firstName} ${i.lastName}`.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        (i.phone || "").toLowerCase().includes(q) ||
        (i.username || "").toLowerCase().includes(q);

      const matchTab =
        activeTab === "all" ||
        (activeTab === "active" && i.isActive) ||
        (activeTab === "inactive" && !i.isActive) ||
        (activeTab === "verified" && i.isEmailVerified);

      return matchSearch && matchTab;
    });
  }, [installers, search, activeTab]);

  const openCreate = () => {
    setEditingInstaller(null);
    setFormOpen(true);
  };

  const openEdit = (installer: InstallerOption) => {
    setEditingInstaller(installer);
    setFormOpen(true);
  };

  const handleSave = async (values: InstallerFormValues) => {
    try {
      setSaving(true);
      if (editingInstaller) {
        await authService.updateInstaller(editingInstaller.uuid, {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          password: values.password.trim() || undefined,
          isActive: values.isActive,
        });
        toast.success("Installateur modifié.");
      } else {
        await authService.createInstaller({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          password: values.password,
        });
        toast.success("Installateur créé.");
      }
      setFormOpen(false);
      setEditingInstaller(null);
      await loadInstallers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Échec de l'enregistrement."));
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (installer: InstallerOption) => {
    const name = `${installer.firstName} ${installer.lastName}`.trim();
    if (
      !window.confirm(
        `Supprimer l'installateur « ${name} » ?\n\nCette action est irréversible. Les projets liés conserveront l'ancien identifiant.`
      )
    ) {
      return;
    }
    try {
      await authService.deleteInstaller(installer.uuid);
      toast.success("Installateur supprimé.");
      if (detailInstaller?.uuid === installer.uuid) setDetailInstaller(null);
      await loadInstallers();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Impossible de supprimer l'installateur."));
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
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

  const StatusBadge = ({ installer }: { installer: InstallerOption }) => (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        installer.isActive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {installer.isActive ? "Actif" : "Inactif"}
    </span>
  );

  const VerifiedBadge = ({ installer }: { installer: InstallerOption }) => (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        installer.isEmailVerified
          ? "bg-blue-100 text-blue-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {installer.isEmailVerified ? "Email vérifié" : "Email en attente"}
    </span>
  );

  const ActionButtons = ({ installer }: { installer: InstallerOption }) => (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => setDetailInstaller(installer)}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-[#4CAF50] transition-colors"
        title="Voir"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => openEdit(installer)}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
        title="Modifier"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(installer)}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Installateurs</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gérez les comptes installateurs de la plateforme
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: "#4CAF50" }}
            >
              <Plus className="w-4 h-4" />
              Ajouter un installateur
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total", value: stats.total, icon: HardHat, color: "#4CAF50" },
              { label: "Actifs", value: stats.active, icon: UserCheck, color: "#2E7D32" },
              { label: "Inactifs", value: stats.inactive, icon: UserX, color: "#E65100" },
              { label: "Vérifiés", value: stats.verified, icon: Mail, color: "#1565C0" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="bg-white rounded-xl p-4 flex items-center gap-3"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${s.color}18` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="bg-white rounded-xl p-4 flex flex-col lg:flex-row gap-4 lg:items-center justify-between"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            <div className="flex flex-wrap gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === t.key
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={
                    activeTab === t.key ? { backgroundColor: "#4CAF50" } : undefined
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] w-56"
                />
              </div>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  className={`p-2 transition-colors ${
                    view === "grid"
                      ? "bg-[#4CAF50] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`p-2 transition-colors ${
                    view === "list"
                      ? "bg-[#4CAF50] text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {!loading && filtered.length === 0 && (
            <div
              className="bg-white rounded-xl p-12 text-center"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Aucun installateur trouvé</p>
              <p className="text-sm text-gray-500 mt-1">
                {search || activeTab !== "all"
                  ? "Modifiez les filtres ou la recherche."
                  : "Ajoutez votre premier installateur pour commencer."}
              </p>
              {!search && activeTab === "all" && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: "#4CAF50" }}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un installateur
                </button>
              )}
            </div>
          )}

          {view === "grid" && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={`sk-${idx}`}
                      className="bg-white rounded-xl overflow-hidden animate-pulse h-52"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                    />
                  ))
                : filtered.map((installer) => (
                    <div
                      key={installer.uuid}
                      className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                    >
                      <div
                        className="h-28 flex items-center justify-center border-b border-gray-100"
                        style={{ backgroundColor: "#E8F5E9" }}
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white"
                          style={{ backgroundColor: "#4CAF50" }}
                        >
                          {initials(installer)}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <StatusBadge installer={installer} />
                          <VerifiedBadge installer={installer} />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {installer.firstName} {installer.lastName}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {installer.email}
                        </p>
                        {installer.phone && (
                          <p className="text-xs text-gray-400 mt-0.5">{installer.phone}</p>
                        )}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-400">
                            {formatDate(installer.createdAt)}
                          </span>
                          <ActionButtons installer={installer} />
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}

          {view === "list" && filtered.length > 0 && (
            <div
              className="bg-white rounded-xl overflow-hidden"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    {[
                      "Installateur",
                      "Email",
                      "Téléphone",
                      "Statut",
                      "Vérification",
                      "Date",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={`lsk-${idx}`} className="border-b border-gray-50">
                          {Array.from({ length: 7 }).map((__, col) => (
                            <td key={col} className="px-5 py-3.5">
                              <div className="h-5 w-full max-w-[120px] rounded bg-gray-100 animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : filtered.map((installer, idx) => (
                        <tr
                          key={installer.uuid}
                          className="border-b border-gray-50 hover:bg-green-50/40 transition-colors"
                          style={{
                            backgroundColor: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                          }}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                style={{ backgroundColor: "#4CAF50" }}
                              >
                                {initials(installer)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {installer.firstName} {installer.lastName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  @{installer.username}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-600">{installer.email}</td>
                          <td className="px-5 py-3.5 text-gray-500">
                            {installer.phone || "—"}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge installer={installer} />
                          </td>
                          <td className="px-5 py-3.5">
                            <VerifiedBadge installer={installer} />
                          </td>
                          <td className="px-5 py-3.5 text-gray-500">
                            {formatDate(installer.createdAt)}
                          </td>
                          <td className="px-5 py-3.5">
                            <ActionButtons installer={installer} />
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <InstallerFormModal
        isOpen={formOpen}
        installer={editingInstaller}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditingInstaller(null);
        }}
        onSubmit={handleSave}
      />

      {detailInstaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetailInstaller(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Détail installateur
              </h3>
              <button
                type="button"
                onClick={() => setDetailInstaller(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: "#4CAF50" }}
                >
                  {initials(detailInstaller)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {detailInstaller.firstName} {detailInstaller.lastName}
                  </p>
                  <p className="text-sm text-gray-500">@{detailInstaller.username}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {detailInstaller.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {detailInstaller.phone || "Non renseigné"}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Inscrit le {formatDate(detailInstaller.createdAt)}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <StatusBadge installer={detailInstaller} />
                <VerifiedBadge installer={detailInstaller} />
              </div>
              <p className="text-xs text-gray-400 font-mono pt-2 border-t border-gray-100">
                UUID : {detailInstaller.uuid}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDetailInstaller(null);
                  openEdit(detailInstaller);
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => setDetailInstaller(null)}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: "#4CAF50" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
