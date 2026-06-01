import React from "react";
import { useNavigate } from "react-router";
import { Search, ChevronDown, Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { ClientStatsCards } from "../components/ClientStatsCards";
import { ClientsTable, Client } from "../components/ClientsTable";
import { ClientEmptyState } from "../components/ClientEmptyState";
import { ClientPagination } from "../components/ClientPagination";
import clientService, { ClientResponse, ClientStats, ClientUserDto } from "../services/clientService";
import { subscribeToClientProjectCounts } from "../services/websocketService";
import { useLiveRefresh } from "../hooks/useLiveRefresh";
import { useAuth } from "../context/AuthContext";

const avatarColors = ["green", "blue", "orange", "purple", "red", "teal"];

function toClient(c: ClientResponse, idx: number): Client {
  return {
    id: String(c.id),
    clientProfileId: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone || "",
    address: c.address || "",
    projectCount: c.projectCount ?? 0,
    addedDate: new Date(c.createdAt).toLocaleDateString("fr-FR"),
    avatarColor: avatarColors[idx % avatarColors.length],
  };
}

function userDtoToClient(
  u: ClientUserDto,
  idx: number,
  projectCount = 0,
  clientProfileId: number | null = null
): Client {
  return {
    id: u.uuid,
    clientProfileId,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone || "",
    address: "",
    projectCount,
    addedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—",
    avatarColor: avatarColors[idx % avatarColors.length],
  };
}

type SortOption = "nameAZ" | "nameZA" | "dateNew" | "dateOld";

export function ClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("nameAZ");
  const [showSortMenu, setShowSortMenu] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [loadError, setLoadError] = React.useState("");
  const [clientStats, setClientStats] = React.useState<ClientStats>({ totalClients: 0, totalProjectsLinked: 0, addedThisMonth: 0 });
  const itemsPerPage = 6;

  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchClients = React.useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      if (isAdmin) {
        // Admin: fetch CLIENT role users from identity service + items_client for project counts
        const [users, projectClients, stats] = await Promise.all([
          clientService.getClientUsers(),
          clientService.getClients({ size: 1000 }),
          clientService.getClientStats(),
        ]);

        // Build a map of userId → linked client profile data from project-service
        const clientLinkByUserId = new Map<string, { clientProfileId: number; projectCount: number }>();
        for (const c of projectClients.content) {
          if (c.userId) {
            clientLinkByUserId.set(c.userId, {
              clientProfileId: c.id,
              projectCount: c.projectCount ?? 0,
            });
          }
        }

        let filtered = users;
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          filtered = users.filter(
            (u) =>
              u.firstName.toLowerCase().includes(q) ||
              u.lastName.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q) ||
              (u.phone || "").includes(q)
          );
        }

        // Sort
        filtered = [...filtered].sort((a, b) => {
          if (sortBy === "nameAZ") return `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`);
          if (sortBy === "nameZA") return `${b.lastName}${b.firstName}`.localeCompare(`${a.lastName}${a.firstName}`);
          if (sortBy === "dateNew") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          if (sortBy === "dateOld") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          return 0;
        });

        setTotalItems(filtered.length);
        const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
        setClients(
          paginated.map((u, i) => {
            const link = clientLinkByUserId.get(u.uuid);
            return userDtoToClient(u, i, link?.projectCount ?? 0, link?.clientProfileId ?? null);
          })
        );
        setClientStats({ ...stats, totalClients: users.length });
      } else {
        // Installer: fetch from project-service items_client
        const sortByMap: Record<SortOption, { field: string; dir: string }> = {
          nameAZ: { field: "lastName", dir: "asc" },
          nameZA: { field: "lastName", dir: "desc" },
          dateNew: { field: "createdAt", dir: "desc" },
          dateOld: { field: "createdAt", dir: "asc" },
        };
        const sort = sortByMap[sortBy];
        const [data, stats] = await Promise.all([
          clientService.getClients({
            search: debouncedSearch || undefined,
            page: currentPage - 1,
            size: itemsPerPage,
            sortBy: sort.field,
            sortDir: sort.dir,
          }),
          clientService.getClientStats(),
        ]);
        setClients(data.content.map((c, i) => toClient(c, i)));
        setTotalItems(data.totalElements);
        setClientStats(stats);
      }

      setLastSyncedAt(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err) {
      console.error("Error fetching clients:", err);
      setLoadError("Impossible de charger les clients. Vérifiez votre connexion puis réessayez.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortBy, currentPage, isAdmin]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  React.useEffect(() => {
    const handler = (payload: { clientId: number | string; projectCount: number }) => {
      setClients((prev) =>
        prev.map((c) =>
          String(c.id) === String(payload.clientId)
            ? { ...c, projectCount: payload.projectCount }
            : c
        )
      );
    };
    subscribeToClientProjectCounts(handler);
    return () => {
      // subscriptions are cleared globally on disconnect; nothing to cleanup here
    };
  }, []);

  useLiveRefresh({
    userId: null,
    token: null,
    intervalMs: 15000,
    onRefresh: fetchClients,
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const stats = {
    totalClients: totalItems,
    totalProjects: clientStats.totalProjectsLinked,
    addedThisMonth: clientStats.addedThisMonth,
  };

  const handleClientClick = (client: Client) => {
    if (!client.clientProfileId) {
      toast.error("Ce client n'a pas encore de fiche projet. Créez/liez un projet d'abord.");
      return;
    }
    navigate(`/clients/${client.clientProfileId}`);
  };

  const handleProjectsClick = (client: Client) => {
    if (!client.clientProfileId) {
      toast.error("Aucun projet lié pour ce client pour le moment.");
      return;
    }
    navigate(`/clients/${client.clientProfileId}/projects`);
  };

  const sortOptions = [
    { value: "nameAZ" as SortOption, label: "Nom A-Z" },
    { value: "nameZA" as SortOption, label: "Nom Z-A" },
    { value: "dateNew" as SortOption, label: "Plus récent" },
    { value: "dateOld" as SortOption, label: "Plus ancien" },
  ];

  const getSortLabel = () => {
    return sortOptions.find((opt) => opt.value === sortBy)?.label || "Nom A-Z";
  };

  // Show empty state if no clients exist
  const showEmptyState = !loading && clients.length === 0 && !debouncedSearch;
  const showSearchEmptyState = !loading && clients.length === 0 && !!debouncedSearch;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-secondary">Clients</h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos clients et leurs projets
              </p>
              {!loading && totalItems > 0 && (
                <p className="text-sm text-muted-foreground mt-2 inline-flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {totalItems} client{totalItems > 1 ? "s" : ""}
                  {debouncedSearch ? " trouvés" : " au total"}
                </p>
              )}
            </div>

            <div className="text-sm text-muted-foreground lg:text-right">
              <p>Synchronisation automatique toutes les 30 secondes</p>
              <p className="text-xs mt-1 text-[#4CAF50]">
                {lastSyncedAt ? `Dernière mise à jour à ${lastSyncedAt}` : "Chargement initial en cours"}
              </p>
            </div>

          </div>

          {showEmptyState ? (
            <ClientEmptyState />
          ) : showSearchEmptyState ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-secondary font-medium">Aucun client ne correspond à votre recherche</p>
              <p className="text-muted-foreground text-sm mt-1">Essayez un autre nom, email ou numéro de téléphone</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <ClientStatsCards stats={stats} />

              {loading ? (
                <>
                  <div className="flex items-center gap-4 flex-wrap animate-pulse">
                    <div className="flex-1 min-w-[280px] h-12 rounded-xl bg-slate-200" />
                    <div className="w-[220px] h-12 rounded-xl bg-slate-200" />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
                    <div className="h-10 bg-slate-100 rounded-lg mb-4" />
                    <div className="space-y-3">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="h-12 bg-slate-100 rounded-lg" />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {loadError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm flex items-center justify-between gap-3">
                      <span>{loadError}</span>
                      <button
                        type="button"
                        onClick={fetchClients}
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Réessayer
                      </button>
                    </div>
                  )}

                  {/* Search & Filter Bar */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Search */}
                    <div className="flex-1 min-w-[280px] relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, email, téléphone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                      />
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-secondary hover:bg-slate-50 transition-colors min-w-[220px] shadow-sm"
                      >
                        <span className="text-muted-foreground">Trier par:</span>
                        <span className="font-medium flex-1 text-left">
                          {getSortLabel()}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {showSortMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowSortMenu(false)}
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
                            {sortOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setSortBy(option.value);
                                  setShowSortMenu(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                                  sortBy === option.value
                                    ? "text-primary font-medium"
                                    : "text-secondary"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Clients Table */}
                  <ClientsTable
                    clients={clients}
                    onClientClick={handleClientClick}
                    onProjectsClick={handleProjectsClick}
                  />

                  {/* Pagination */}
                  {totalItems > 0 && (
                    <ClientPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

    </div>
  );
}