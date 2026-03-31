import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronRight,
  Edit,
  Download,
  Sparkles,
  Sun,
  Moon,
  TrendingUp,
  MapPin,
  Calendar,
  User,
  Battery,
  Maximize,
  Loader2,
  Zap,
} from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import projectService, { ProjectResponse } from "../services/projectService";
import dimensioningService, {
  DimensioningResponse,
  ComparisonResponse,
} from "../services/dimensioningService";
import { DimensioningModal } from "../components/DimensioningModal";
import { ComparisonView } from "../components/ComparisonView";

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [dimensioning, setDimensioning] = useState<DimensioningResponse | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDimensioningModal, setShowDimensioningModal] = useState(false);

  const fetchDimensioning = async (projectId: number) => {
    try {
      const dims = await dimensioningService.getByProject(projectId);
      if (dims && dims.length > 0) setDimensioning(dims[dims.length - 1]);
    } catch {
      // Dimensioning may not exist yet
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const proj = await projectService.getProject(Number(id));
        setProject(proj);
        await fetchDimensioning(Number(id));
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDimensioningResult = (result: DimensioningResponse | null, comp: ComparisonResponse | null) => {
    if (comp) {
      setComparison(comp);
      setDimensioning(comp.nightPanel); // Show night panel as primary
    } else if (result) {
      setDimensioning(result);
      setComparison(null);
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      CREATED: { label: "Créé", bg: "bg-gray-100", text: "text-gray-700" },
      IN_PROGRESS: { label: "En cours", bg: "bg-blue-100", text: "text-blue-700" },
      COMPLETED: { label: "Terminé", bg: "bg-green-100", text: "text-green-700" },
      CANCELLED: { label: "Annulé", bg: "bg-red-100", text: "text-red-700" },
    };
    return map[s] || { label: s, bg: "bg-gray-100", text: "text-gray-700" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 p-6">
          <p className="text-gray-500">Projet non trouvé</p>
        </main>
      </div>
    );
  }

  const st = statusLabel(project.status);

  // Financial data from dimensioning
  const inst = dimensioning?.installation;
  const fin = dimensioning?.financials;

  const annualProduction = inst?.estimatedAnnualProductionKwh
    ? `${Math.round(inst.estimatedAnnualProductionKwh).toLocaleString()} kWh/an`
    : "—";
  const totalCost = fin?.totalInvestmentCost
    ? `${Math.round(fin.totalInvestmentCost).toLocaleString()} TND`
    : project.budget ? `${project.budget.toLocaleString()} TND` : "—";
  const annualSavings = fin?.annualSavings
    ? `${Math.round(fin.annualSavings).toLocaleString()} TND`
    : "—";
  const paybackPeriod = fin?.paybackPeriodYears
    ? `${fin.paybackPeriodYears.toFixed(1)} ans`
    : "—";
  const roi = fin?.roiPercentage
    ? `${Math.round(fin.roiPercentage)}%`
    : "—";

  const financialData = fin?.cumulativeCashFlow
    ? fin.cumulativeCashFlow
        .filter((_: number, i: number) => i % 5 === 0)
        .map((v: number, i: number) => ({ year: i * 5, savings: Math.round(v) }))
    : [
        { year: 0, savings: 0 },
        { year: 5, savings: 7350 },
        { year: 10, savings: 14700 },
        { year: 15, savings: 22050 },
        { year: 20, savings: 29400 },
        { year: 25, savings: 36750 },
      ];

  const isNightPanelResult = dimensioning?.panelType === "NIGHT_PANEL";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/projects")}
              className="text-muted-foreground hover:text-secondary transition-colors"
            >
              Projets
            </button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-secondary font-medium">{project.name}</span>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-secondary">
                {project.name}
              </h1>
              <span className={`px-3 py-1 ${st.bg} ${st.text} rounded-full text-sm font-medium`}>
                {st.label}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-gray-300 text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => setShowDimensioningModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Dimensionner
              </button>
              {dimensioning && (
                <button
                  onClick={() => dimensioningService.downloadPdf(dimensioning.id)}
                  className="px-4 py-2 border border-gray-300 text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Project Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Informations du projet
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Client</p>
                  <p className="text-sm font-medium text-secondary flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {project.client ? `${project.client.firstName} ${project.client.lastName}` : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Localisation
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {project.location}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Latitude
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {project.latitude}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Longitude
                  </p>
                  <p className="text-sm font-medium text-secondary">
                    {project.longitude}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Puissance
                  </p>
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    {project.peakPower} kWc
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Surface</p>
                  <p className="text-sm font-medium text-secondary flex items-center gap-2">
                    <Maximize className="w-4 h-4 text-muted-foreground" />
                    {project.availableArea ? `${project.availableArea} m²` : "—"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Date de création
                  </p>
                  <p className="text-sm font-medium text-secondary flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(project.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Dimensioning Results */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                {isNightPanelResult ? (
                  <Moon className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Sun className="w-5 h-5 text-accent" />
                )}
                Résultats du dimensionnement
                {isNightPanelResult && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    Night Panel
                  </span>
                )}
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">
                    Production annuelle
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {annualProduction}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Panneaux
                    </p>
                    <p className="text-lg font-semibold text-secondary">
                      {inst?.panelCount || "—"} × {inst?.panelModel || ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Puissance crête
                    </p>
                    <p className="text-lg font-semibold text-secondary">
                      {inst?.totalCapacityKw || project.peakPower} kWc
                    </p>
                  </div>

                  {isNightPanelResult && inst?.storageCapacityKwh && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          🔋 Stockage total
                        </p>
                        <p className="text-lg font-semibold text-indigo-600">
                          {inst.storageCapacityKwh} kWh
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          🌙 Autoconsommation
                        </p>
                        <p className="text-lg font-semibold text-indigo-600">
                          {Math.round((inst.selfConsumptionRate || 0) * 100)}%
                        </p>
                      </div>
                    </>
                  )}

                  {!isNightPanelResult && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Inclinaison
                        </p>
                        <p className="text-lg font-semibold text-secondary">
                          {project.inclination}°
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Orientation
                        </p>
                        <p className="text-lg font-semibold text-secondary">
                          {project.orientation}°
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Analysis Card - Full Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Analyse financière
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Coût total</p>
                <p className="text-xl font-bold text-secondary">
                  {totalCost}
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Économie annuelle
                </p>
                <p className="text-xl font-bold text-primary">
                  {annualSavings}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Délai de rentabilité
                </p>
                <p className="text-xl font-bold text-secondary">
                  {paybackPeriod}
                </p>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  ROI sur 25 ans
                </p>
                <p className="text-xl font-bold text-accent">
                  {roi}
                </p>
              </div>
            </div>

            {/* ROI Chart */}
            <div className="h-64">
              <p className="text-sm font-medium text-secondary mb-3">
                Économies cumulées sur 25 ans
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData}>
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="year"
                    label={{ value: "Années", position: "insideBottom", offset: -5 }}
                    stroke="#6B7280"
                  />
                  <YAxis
                    label={{ value: "TND", angle: -90, position: "insideLeft" }}
                    stroke="#6B7280"
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value.toLocaleString()} TND`, "Économies"]}
                    labelFormatter={(label) => `Année ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#2ECC71"
                    strokeWidth={2}
                    fill="url(#savingsGradient)"
                  />
                  {/* Breakeven point marker */}
                  <line
                    x1="35%"
                    y1="0"
                    x2="35%"
                    y2="100%"
                    stroke="#F39C12"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison View - Full Width */}
          {comparison && (
            <ComparisonView data={comparison} />
          )}

          {/* AI Recommendation Card - Full Width */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-secondary mb-2">
                  Recommandation IA
                </h2>
                <p className="text-secondary leading-relaxed whitespace-pre-line">
                  {dimensioning?.aiRecommendation ||
                    `Basé sur l'analyse de votre projet, nous recommandons une
                  installation orientée plein sud avec une inclinaison de 35°
                  pour maximiser la production d'énergie. Le système de ${project.peakPower || '3.5'} kWc
                  est parfaitement dimensionné pour votre résidence et
                  permettra de couvrir environ 65% de vos besoins énergétiques
                  annuels.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-600">
              <Sparkles className="w-3 h-3" />
              <span className="font-medium">Powered by Ollama AI</span>
            </div>
          </div>
        </div>
      </main>

      {/* Dimensioning Modal */}
      {showDimensioningModal && (
        <DimensioningModal
          isOpen={showDimensioningModal}
          projectId={project.id}
          projectData={{
            latitude: project.latitude,
            longitude: project.longitude,
            availableArea: project.roofArea || 25,
            inclination: project.inclination || 35,
            orientation: project.orientation || 0,
          }}
          onClose={() => setShowDimensioningModal(false)}
          onResult={handleDimensioningResult}
        />
      )}
    </div>
  );
}
