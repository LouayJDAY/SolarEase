import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronRight,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
  ArrowRight,
  Battery,
  Sun,
  Loader2,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import clientService, { ClientResponse } from "../services/clientService";
import projectService, { ProjectResponse } from "../services/projectService";

const statusMap: Record<string, { label: string; color: string }> = {
  CREATED: { label: "Créé", color: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { label: "En cours", color: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Terminé", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Annulé", color: "bg-red-100 text-red-700" },
};

export function ClientDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState<ClientResponse | null>(null);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const numId = Number(id);
    setLoading(true);
    Promise.all([
      clientService.getClient(numId),
      projectService.getProjectsByClientId(numId),
    ])
      .then(([c, p]) => {
        setClient(c);
        setProjects(p);
      })
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [id]);

  const getInitials = () => {
    if (!client) return "";
    return `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-TN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const totalPower = projects.reduce((sum, p) => sum + (p.peakPower || 0), 0);
  const totalProduction = totalPower * 1500; // Rough estimation: 1500 kWh/kWc/year

  const handleDelete = async () => {
    if (!client) return;
    if (!window.confirm(`Supprimer le client ${client.firstName} ${client.lastName} ?`)) return;
    try {
      await clientService.deleteClient(client.id);
      navigate("/clients");
    } catch {
      alert("Erreur lors de la suppression du client");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 flex flex-col items-center justify-center h-[80vh] gap-4">
          <p className="text-lg text-muted-foreground">Client introuvable</p>
          <button onClick={() => navigate("/clients")} className="text-primary hover:underline font-medium">
            ← Retour aux clients
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/clients")}
              className="text-muted-foreground hover:text-secondary transition-colors"
            >
              Clients
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-secondary font-medium">
              {client.firstName} {client.lastName}
            </span>
          </div>

          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-2xl">
                  {getInitials()}
                </div>

                {/* Name & Email */}
                <div>
                  <h1 className="text-2xl font-bold text-secondary mb-1">
                    {client.firstName} {client.lastName}
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {client.email}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/clients`)}
                  className="px-4 py-2 border border-gray-300 text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 text-destructive rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Information */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card 1: Personal Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Informations personnelles
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Prénom</p>
                    <p className="text-sm font-medium text-secondary">
                      {client.firstName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nom</p>
                    <p className="text-sm font-medium text-secondary">
                      {client.lastName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-medium text-secondary flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {client.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Téléphone
                    </p>
                    <p className="text-sm font-medium text-secondary flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {client.phone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Adresse</p>
                    <p className="text-sm font-medium text-secondary flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {client.address || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Client depuis
                    </p>
                    <p className="text-sm font-medium text-secondary flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {formatDate(client.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Summary Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-secondary mb-4">
                  Résumé
                </h2>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-muted-foreground mb-1">
                      Projets
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {projects.length}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Battery className="w-3 h-3" />
                      Total kWc
                    </p>
                    <p className="text-2xl font-bold text-green-700">
                      {totalPower} kWc
                    </p>
                  </div>

                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      Production estimée
                    </p>
                    <p className="text-2xl font-bold text-accent">
                      {totalProduction.toLocaleString()} kWh/an
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Projects */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-secondary mb-4">
                  Projets du client
                </h2>

                {/* Projects List */}
                <div className="space-y-3 mb-4">
                  {projects.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun projet pour ce client
                    </p>
                  )}
                  {projects.map((project) => {
                    const st = statusMap[project.status] || statusMap.CREATED;
                    return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-secondary mb-1">
                          {project.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {project.peakPower} kWc
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${st.color}`}
                        >
                          {st.label}
                        </span>
                        <button className="text-primary hover:text-primary/80 flex items-center gap-1 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          Voir
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Add Project Button */}
                <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-primary hover:border-primary hover:bg-primary/5 transition-colors font-medium flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Créer un projet pour ce client
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
