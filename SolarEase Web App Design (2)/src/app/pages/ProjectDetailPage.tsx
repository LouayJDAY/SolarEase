import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ChevronRight,
  Edit,
  Download,
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
  AlertCircle,
  MessageSquare,
  HardHat,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Car,
  Wrench,
  PauseCircle,
  Flag,
  Activity,
  Send,
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
import fieldUpdateService, {
  FieldUpdate,
  FieldUpdateCreateRequest,
  InstallerFieldStatus,
  FIELD_STATUS_LABELS,
  FIELD_STATUS_COLORS,
} from "../services/fieldUpdateService";
import { DimensioningModal } from "../components/DimensioningModal";
import { ComparisonView } from "../components/ComparisonView";
import { InstallerRecommendationCard } from "../components/InstallerRecommendationCard";
import { InstallationChecklist } from "../components/terrain/InstallationChecklist";
import { BlockageForm } from "../components/terrain/BlockageForm";
import { FieldUpdateTimeline } from "../components/terrain/FieldUpdateTimeline";
import { TerrainKitReminder } from "../components/terrain/TerrainKitReminder";
import { ActiveChantiersPanel } from "../components/terrain/ActiveChantiersPanel";
import type {
  BlockageImpactKey,
  BlockageTypeKey,
} from "../constants/installationPhases";
import { useAuth } from "../context/AuthContext";
import { EditProjectModal } from "../components/EditProjectModal";
import toast from "react-hot-toast";

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [dimensioning, setDimensioning] = useState<DimensioningResponse | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDimensioningModal, setShowDimensioningModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"apercu" | "terrain">("apercu");

  // Field updates state
  const [fieldUpdates, setFieldUpdates] = useState<FieldUpdate[]>([]);
  const [fieldUpdatesLoading, setFieldUpdatesLoading] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [validatingId, setValidatingId] = useState<number | null>(null);

  // Form state
  const [formStatus, setFormStatus] = useState<InstallerFieldStatus>("SUR_SITE");
  const [formProgress, setFormProgress] = useState(0);
  const [formNote, setFormNote] = useState("");
  const [formIsBlockage, setFormIsBlockage] = useState(false);
  const [formBlockageReason, setFormBlockageReason] = useState("");
  const [formRequiresValidation, setFormRequiresValidation] = useState(false);

  // Enhanced terrain form state
  const [formCompletedSteps, setFormCompletedSteps] = useState<string[]>([]);
  const [formBlockageType, setFormBlockageType] = useState<BlockageTypeKey | "">("");
  const [formBlockageImpact, setFormBlockageImpact] = useState<BlockageImpactKey | "">("");
  const [formPhotoUrl, setFormPhotoUrl] = useState<string>("");
  const [photoLoading, setPhotoLoading] = useState(false);

  // Validation modal state
  const [validationModal, setValidationModal] = useState<{ update: FieldUpdate; decision: boolean } | null>(null);
  const [validationNote, setValidationNote] = useState("");

  // Notification modal state (ADMIN only)
  const [notifModal, setNotifModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifRole, setNotifRole] = useState<"CLIENT" | "INSTALLER" | "ALL">("ALL");
  const [notifSending, setNotifSending] = useState(false);

  // Status change state (ADMIN only)
  const [pendingStatus, setPendingStatus] = useState<string>("");
  const [statusChanging, setStatusChanging] = useState(false);

  const loadRecommendationInBackground = (dimensioningId: number) => {
    setRecommendationLoading(true);
    dimensioningService
      .regenerateRecommendation(dimensioningId)
      .then((refreshed) => setDimensioning(refreshed))
      .catch(() => {
        /* Garder aiRecommendation en fallback */
      })
      .finally(() => setRecommendationLoading(false));
  };

  const fetchDimensioning = async (projectId: number) => {
    try {
      const dims = await dimensioningService.getByProject(projectId);
      if (dims && dims.length > 0) {
        const latest = dims[dims.length - 1];
        setDimensioning(latest);
        // Régénération non bloquante — Ollama peut prendre 30-60 s
        if (!latest.installerRecommendation) {
          loadRecommendationInBackground(latest.id);
        }
      }
    } catch {
      // Dimensioning may not exist yet
    }
  };

  const handleRegenerateRecommendation = async () => {
    if (!dimensioning) return;
    setRecommendationLoading(true);
    try {
      const refreshed = await dimensioningService.regenerateRecommendation(
        dimensioning.id
      );
      setDimensioning(refreshed);
      toast.success("Recommandation IA mise à jour");
    } catch {
      toast.error("Impossible de régénérer la recommandation");
    } finally {
      setRecommendationLoading(false);
    }
  };

  const fetchFieldUpdates = useCallback(async (projectId: number) => {
    setFieldUpdatesLoading(true);
    try {
      const updates = await fieldUpdateService.getFieldUpdates(projectId);
      setFieldUpdates(updates);
    } catch {
      // Field updates may not exist yet
    } finally {
      setFieldUpdatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const proj = await projectService.getProject(Number(id));
        setProject(proj);
        await fetchDimensioning(Number(id));
        await fetchFieldUpdates(Number(id));
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, fetchFieldUpdates]);

  // Poll field updates every 10 s when terrain tab is active
  useEffect(() => {
    if (activeTab !== "terrain" || !id) return;
    const interval = setInterval(() => fetchFieldUpdates(Number(id)), 10000);
    return () => clearInterval(interval);
  }, [activeTab, id, fetchFieldUpdates]);

  const handleDimensioningResult = (result: DimensioningResponse | null, comp: ComparisonResponse | null) => {
    if (comp) {
      setComparison(comp);
      setDimensioning(comp.nightPanel); // Show night panel as primary
    } else if (result) {
      setDimensioning(result);
      setComparison(null);
    }
  };

  const handleSaveProject = async (data: any) => {
    if (!project) return false;

    try {
      const updated = await projectService.updateProject(project.id, {
        name: data.name,
        description: data.description,
        location: data.location,
        latitude: Number(data.latitude) || 0,
        longitude: Number(data.longitude) || 0,
        peakPower: Number(data.peakPower) || 0,
        availableArea: Number(data.availableArea) || 0,
        inclination: Number(data.inclination) || 35,
        orientation: Number(data.orientation) || 0,
        budget: Number(data.budget) || 0,
        clientId: project.client?.id,
        installerId: user?.role === "ADMIN" ? data.installerId?.trim() || project.installerId : project.installerId,
        installerEmail: user?.role === "ADMIN" ? data.installerEmail?.trim() || project.installerEmail : project.installerEmail,
      });
      setProject(updated);
      return true;
    } catch (err) {
      console.error("Error updating project:", err);
      return false;
    }
  };

  const handleSubmitFieldUpdate = async () => {
    if (!project) return;
    const isBlockage = formIsBlockage || formStatus === "BLOCAGE";
    if (isBlockage && !formBlockageReason.trim() && !formBlockageType) {
      toast.error("Précisez le motif ou le type de blocage");
      return;
    }
    setSubmittingUpdate(true);
    try {
      const useChecklist = formCompletedSteps.length > 0;
      const req: FieldUpdateCreateRequest = {
        fieldStatus: formStatus,
        progressPercent: useChecklist ? undefined : formProgress,
        completedSteps: useChecklist ? formCompletedSteps : undefined,
        note: formNote || undefined,
        isBlockage,
        blockageReason: isBlockage ? formBlockageReason || undefined : undefined,
        blockageType: isBlockage && formBlockageType ? formBlockageType : undefined,
        blockageImpact: isBlockage && formBlockageImpact ? formBlockageImpact : undefined,
        requiresAdminValidation: formRequiresValidation,
        photoUrl: formPhotoUrl || undefined,
      };
      await fieldUpdateService.createFieldUpdate(project.id, req);
      toast.success("Mise à jour terrain enregistrée");
      setFormNote("");
      setFormIsBlockage(false);
      setFormBlockageReason("");
      setFormRequiresValidation(false);
      setFormCompletedSteps([]);
      setFormBlockageType("");
      setFormBlockageImpact("");
      setFormPhotoUrl("");
      await fetchFieldUpdates(project.id);
      const updated = await projectService.getProject(project.id);
      setProject(updated);
    } catch {
      toast.error("Erreur lors de l'envoi de la mise à jour");
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handlePhotoChange = (file: File | null) => {
    if (!file) {
      setFormPhotoUrl("");
      return;
    }
    if (file.size > 800 * 1024) {
      toast.error("Photo trop lourde (max 800 Ko)");
      return;
    }
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setFormPhotoUrl(typeof reader.result === "string" ? reader.result : "");
      setPhotoLoading(false);
    };
    reader.onerror = () => {
      toast.error("Lecture du fichier impossible");
      setPhotoLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleValidate = async (validated: boolean) => {
    if (!validationModal || !project) return;
    setValidatingId(validationModal.update.id);
    try {
      await fieldUpdateService.validateFieldUpdate(
        project.id,
        validationModal.update.id,
        validated,
        validationNote || undefined
      );
      toast.success(validated ? "Mise à jour validée" : "Mise à jour rejetée");
      setValidationModal(null);
      setValidationNote("");
      await fetchFieldUpdates(project.id);
    } catch {
      toast.error("Erreur lors de la validation");
    } finally {
      setValidatingId(null);
    }
  };

  const handleSendNotification = async () => {
    if (!project || !notifTitle.trim() || !notifMessage.trim()) return;
    setNotifSending(true);
    try {
      await import("../services/api").then(({ default: api }) =>
        api.post("/notifications/send", {
          title: notifTitle,
          message: notifMessage,
          targetType: "ROLE_IN_PROJECT",
          projectId: project.id,
          targetRole: notifRole,
        })
      );
      toast.success("Notification envoyée avec succès");
      setNotifModal(false);
      setNotifTitle("");
      setNotifMessage("");
      setNotifRole("ALL");
    } catch {
      toast.error("Erreur lors de l'envoi de la notification");
    } finally {
      setNotifSending(false);
    }
  };

  const handleStatusChange = async () => {
    if (!project || !pendingStatus) {
      return;
    }
    setStatusChanging(true);
    try {
      const updated = await projectService.updateProjectStatus(project.id, pendingStatus);
      setProject(updated);
      setPendingStatus("");
      toast.success(`Statut mis à jour : ${STATUS_OPTIONS.find((o) => o.value === updated.status)?.label ?? updated.status}`);
    } catch (err: any) {
      console.error("Error updating project status:", err);
      toast.error(err?.response?.data?.message ?? "Impossible de changer le statut du projet");
    } finally {
      setStatusChanging(false);
    }
  };

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: "CREATED",              label: "Créé" },
    { value: "EN_PREPARATION",       label: "En préparation" },
    { value: "INSTALLATEUR_AFFECTE", label: "Installateur affecté" },
    { value: "IN_PROGRESS",          label: "En cours" },
    { value: "COMPLETED",            label: "Terminé" },
    { value: "CANCELLED",            label: "Annulé" },
  ];

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      CREATED:              { label: "Créé",                  bg: "bg-gray-100",   text: "text-gray-700" },
      EN_PREPARATION:       { label: "En préparation",         bg: "bg-blue-100",   text: "text-blue-700" },
      INSTALLATEUR_AFFECTE: { label: "Installateur affecté",   bg: "bg-purple-100", text: "text-purple-700" },
      IN_PROGRESS:          { label: "En cours",               bg: "bg-orange-100", text: "text-orange-700" },
      COMPLETED:            { label: "Terminé",                bg: "bg-green-100",  text: "text-green-700" },
      CANCELLED:            { label: "Annulé",                 bg: "bg-red-100",    text: "text-red-700" },
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
  const hasDimensioning = !!dimensioning;

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-secondary">
                  {project.name}
                </h1>
                <span className={`px-3 py-1 ${st.bg} ${st.text} rounded-full text-sm font-medium`}>
                  {st.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>ID projet: PRJ-{project.id}</span>
                <span>•</span>
                <span>Créé le {new Date(project.createdAt).toLocaleDateString("fr-FR")}</span>
                <span>•</span>
                <span>{hasDimensioning ? "Dimensionnement disponible" : "Dimensionnement en attente"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Status change — ADMIN only */}
              {user?.role === "ADMIN" && (
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                  <select
                    value={pendingStatus || project.status}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPendingStatus(v !== project.status ? v : "");
                    }}
                    className="text-sm text-secondary bg-transparent focus:outline-none pr-1"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleStatusChange}
                    disabled={!pendingStatus || statusChanging}
                    className="flex items-center gap-1 px-2.5 py-1 bg-primary text-white rounded-lg text-xs font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    {statusChanging ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Appliquer
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 border border-gray-300 text-secondary rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {user?.role === "ADMIN" ? "Modifier / Réaffecter" : "Modifier"}
              </button>
              <button
                onClick={() => navigate(`/projects/${project.id}/messages`)}
                className="px-4 py-2 border border-gray-300 text-secondary rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </button>
              {user?.role === "ADMIN" && (
                <button
                  onClick={() => setNotifModal(true)}
                  className="px-4 py-2 border border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Notifier
                </button>
              )}
              <button
                onClick={() => setShowDimensioningModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-sm flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {hasDimensioning ? "Re-dimensionner" : "Dimensionner"}
              </button>
              {hasDimensioning && (
                <button
                  onClick={() => dimensioningService.downloadPdf(dimensioning.id)}
                  className="px-4 py-2 border border-gray-300 text-secondary rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("apercu")}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "apercu"
                  ? "bg-white border border-b-white border-slate-200 text-primary -mb-px"
                  : "text-slate-500 hover:text-secondary"
              }`}
            >
              Aperçu
            </button>
            <button
              onClick={() => setActiveTab("terrain")}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
                activeTab === "terrain"
                  ? "bg-white border border-b-white border-slate-200 text-primary -mb-px"
                  : "text-slate-500 hover:text-secondary"
              }`}
            >
              <HardHat className="w-4 h-4" />
              Terrain
              {fieldUpdates.length > 0 && (
                <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {fieldUpdates.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "terrain" && (
            <div className="space-y-6">
              {/* Admin cross-project view */}
              {user?.role === "ADMIN" && project && (
                <ActiveChantiersPanel excludeProjectId={project.id} />
              )}

              {/* Installer form — ADMIN is read-only on terrain */}
              {user?.role === "INSTALLER" && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-base font-semibold text-secondary mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Signaler une mise à jour terrain
                  </h2>

                  <div className="space-y-5">
                    {/* Status picker */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-2">Statut terrain</label>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(FIELD_STATUS_LABELS) as [InstallerFieldStatus, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => setFormStatus(key)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                              formStatus === key
                                ? "border-primary bg-primary text-white shadow-sm"
                                : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Phase checklist (auto progress %) */}
                    <InstallationChecklist
                      completedSteps={formCompletedSteps}
                      onChange={setFormCompletedSteps}
                      disabled={submittingUpdate}
                    />

                    {/* Manual progress slider — fallback when no checklist used */}
                    {formCompletedSteps.length === 0 && (
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2">
                          Avancement (saisie libre) :{" "}
                          <span className="text-primary font-bold">{formProgress}%</span>
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={formProgress}
                          onChange={(e) => setFormProgress(Number(e.target.value))}
                          className="w-full accent-primary"
                        />
                        <p className="text-[11px] text-slate-400 mt-1">
                          Astuce : cocher les phases ci-dessus calcule automatiquement le %.
                        </p>
                      </div>
                    )}

                    {/* Kit reminder when EN_INSTALLATION */}
                    {formStatus === "EN_INSTALLATION" && (
                      <TerrainKitReminder kit={dimensioning?.installerRecommendation?.recommendedKit} />
                    )}

                    {/* Note */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Note de terrain</label>
                      <textarea
                        value={formNote}
                        onChange={(e) => setFormNote(e.target.value)}
                        rows={3}
                        placeholder="Décrivez l'avancement, les conditions, les observations..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>

                    {/* Photo upload (data-URL MVP) */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Photo (optionnel, max 800 Ko)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                          className="text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                        {photoLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                        {formPhotoUrl && !photoLoading && (
                          <div className="flex items-center gap-2">
                            <img
                              src={formPhotoUrl}
                              alt="Aperçu"
                              className="w-12 h-12 object-cover rounded-md border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => setFormPhotoUrl("")}
                              className="text-xs text-slate-500 hover:text-red-500"
                            >
                              Retirer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Blockage toggle + structured form */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="blockage"
                        checked={formIsBlockage || formStatus === "BLOCAGE"}
                        onChange={(e) => setFormIsBlockage(e.target.checked)}
                        disabled={formStatus === "BLOCAGE"}
                        className="mt-0.5 accent-red-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="blockage" className="text-sm font-medium text-slate-700 cursor-pointer">
                          Signaler un blocage / retard
                        </label>
                        {(formIsBlockage || formStatus === "BLOCAGE") && (
                          <div className="mt-2">
                            <BlockageForm
                              blockageType={formBlockageType}
                              blockageImpact={formBlockageImpact}
                              blockageReason={formBlockageReason}
                              onChange={(patch) => {
                                if (patch.blockageType !== undefined) setFormBlockageType(patch.blockageType);
                                if (patch.blockageImpact !== undefined) setFormBlockageImpact(patch.blockageImpact);
                                if (patch.blockageReason !== undefined) setFormBlockageReason(patch.blockageReason);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requires admin validation */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="validation"
                        checked={formRequiresValidation}
                        onChange={(e) => setFormRequiresValidation(e.target.checked)}
                        className="accent-primary"
                      />
                      <label htmlFor="validation" className="text-sm text-slate-700 cursor-pointer">
                        Cette étape nécessite une validation de l'admin
                      </label>
                    </div>

                    <button
                      onClick={handleSubmitFieldUpdate}
                      disabled={submittingUpdate}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-sm disabled:opacity-60"
                    >
                      {submittingUpdate ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Envoyer la mise à jour
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-secondary mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Historique des mises à jour terrain
                  {fieldUpdatesLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-2" />}
                </h2>

                <FieldUpdateTimeline
                  updates={fieldUpdates}
                  isAdmin={user?.role === "ADMIN"}
                  validatingId={validatingId}
                  onValidate={(u, dec) => {
                    setValidationModal({ update: u, decision: dec });
                    setValidationNote("");
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === "apercu" && (<>
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

              {!hasDimensioning ? (
                <div className="p-5 rounded-xl border border-amber-200 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Aucun dimensionnement disponible</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Lancez un calcul pour afficher les résultats techniques, financiers et la recommandation IA.
                      </p>
                      <button
                        onClick={() => setShowDimensioningModal(true)}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors text-sm font-medium"
                      >
                        <Zap className="w-4 h-4" />
                        Démarrer le dimensionnement
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>

          {/* Financial Analysis Card - Full Width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Analyse financière
            </h2>

            {!hasDimensioning ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-secondary font-medium">Les indicateurs financiers apparaîtront après le premier dimensionnement.</p>
                <p className="text-sm text-muted-foreground mt-1">Vous obtiendrez ici le coût, l’épargne annuelle, le ROI et la courbe des gains cumulés.</p>
              </div>
            ) : (
            <>
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
            </>
            )}
          </div>

          {/* Comparison View - Full Width */}
          {comparison && (
            <ComparisonView data={comparison} />
          )}

          {/* AI Recommendation Card - Full Width */}
          <InstallerRecommendationCard
            recommendation={dimensioning?.installerRecommendation}
            fallbackText={dimensioning?.aiRecommendation}
            loading={recommendationLoading}
            onRegenerate={dimensioning ? handleRegenerateRecommendation : undefined}
          />
          </>)}
        </div>
      </main>

      {/* Validation modal */}
      {validationModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-secondary">
              {validationModal.decision ? "Valider" : "Rejeter"} la mise à jour
            </h3>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
              <p><span className="font-medium">Statut:</span> {FIELD_STATUS_LABELS[validationModal.update.fieldStatus]}</p>
              <p><span className="font-medium">Avancement:</span> {validationModal.update.progressPercent}%</p>
              {validationModal.update.note && <p className="mt-1 italic">{validationModal.update.note}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Note admin (optionnel)</label>
              <textarea
                value={validationNote}
                onChange={(e) => setValidationNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="Ajouter un commentaire..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setValidationModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleValidate(validationModal.decision)}
                disabled={!!validatingId}
                className={`px-5 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 disabled:opacity-60 ${
                  validationModal.decision
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {validatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {validationModal.decision ? "Confirmer la validation" : "Confirmer le rejet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification modal — ADMIN only */}
      {notifModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-secondary flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              Envoyer une notification
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Titre *</label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Titre de la notification..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Message *</label>
              <textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                rows={3}
                placeholder="Contenu du message..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Destinataire</label>
              <select
                value={notifRole}
                onChange={(e) => setNotifRole(e.target.value as "CLIENT" | "INSTALLER" | "ALL")}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              >
                <option value="ALL">Tous (client + installateur)</option>
                <option value="CLIENT">Client uniquement</option>
                <option value="INSTALLER">Installateur uniquement</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setNotifModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendNotification}
                disabled={notifSending || !notifTitle.trim() || !notifMessage.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60 transition-colors"
              >
                {notifSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      <EditProjectModal
        isOpen={showEditModal}
        isAdmin={user?.role === "ADMIN"}
        project={project}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSaveProject}
      />

      {/* Dimensioning Modal */}
      {showDimensioningModal && (
        <DimensioningModal
          isOpen={showDimensioningModal}
          projectId={project.id}
          projectData={{
            latitude: project.latitude,
            longitude: project.longitude,
            availableArea: project.availableArea || 25,
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
