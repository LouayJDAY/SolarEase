import React from "react";
import { useNavigate } from "react-router";
import { Search, ChevronDown, Plus } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { ClientStatsCards } from "../components/ClientStatsCards";
import { ClientsTable, Client } from "../components/ClientsTable";
import { NewClientModal } from "../components/NewClientModal";
import { ClientEmptyState } from "../components/ClientEmptyState";
import { ClientPagination } from "../components/ClientPagination";
import clientService, { ClientResponse } from "../services/clientService";

const avatarColors = ["green", "blue", "orange", "purple", "red", "teal"];

function toClient(c: ClientResponse, idx: number): Client {
  return {
    id: String(c.id),
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone || "",
    address: c.address || "",
    projectCount: 0,
    addedDate: new Date(c.createdAt).toLocaleDateString("fr-FR"),
    avatarColor: avatarColors[idx % avatarColors.length],
  };
}

type SortOption = "nameAZ" | "nameZA" | "dateNew" | "dateOld";

export function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortOption>("nameAZ");
  const [showSortMenu, setShowSortMenu] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const itemsPerPage = 6;

  const fetchClients = React.useCallback(async () => {
    try {
      setLoading(true);
      const sortByMap: Record<SortOption, { field: string; dir: string }> = {
        nameAZ: { field: "lastName", dir: "asc" },
        nameZA: { field: "lastName", dir: "desc" },
        dateNew: { field: "createdAt", dir: "desc" },
        dateOld: { field: "createdAt", dir: "asc" },
      };
      const sort = sortByMap[sortBy];
      const data = await clientService.getClients({
        search: searchQuery || undefined,
        page: currentPage - 1,
        size: itemsPerPage,
        sortBy: sort.field,
        sortDir: sort.dir,
      });
      setClients(data.content.map((c, i) => toClient(c, i)));
      setTotalItems(data.totalElements);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, currentPage]);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate stats
  const stats = React.useMemo(() => {
    return {
      totalClients: totalItems,
      totalProjects: 0,
      addedThisMonth: 0,
    };
  }, [totalItems]);

  const handleClientClick = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleNewClient = () => {
    setIsModalOpen(true);
  };

  const handleCreateClient = async (data: any) => {
    try {
      await clientService.createClient({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: `${data.address}, ${data.city} ${data.postalCode}`.trim(),
      });
      fetchClients();
    } catch (err) {
      console.error("Error creating client:", err);
    }
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
  const showEmptyState = !loading && clients.length === 0 && !searchQuery;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-secondary">Clients</h1>
              <p className="text-muted-foreground mt-1">
                Gérez vos clients et leurs projets
              </p>
            </div>

            {!showEmptyState && (
              <button
                onClick={handleNewClient}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Nouveau Client
              </button>
            )}
          </div>

          {showEmptyState ? (
            <ClientEmptyState onAddClient={handleNewClient} />
          ) : (
            <>
              {/* Stats Cards */}
              <ClientStatsCards stats={stats} />

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email, téléphone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-secondary hover:bg-gray-50 transition-colors min-w-[200px]"
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
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
        </div>
      </main>

      {/* New Client Modal */}
      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateClient}
      />
    </div>
  );
}