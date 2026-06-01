import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import { StatusBadge } from "../../components/client/StatusBadge";
import { ProjectStepper, ProjectStep } from "../../components/client/ProjectStepper";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Zap,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import projectService, { ProjectResponse } from "../../services/projectService";
import quoteService, { Quote } from "../../services/quoteService";
import documentService from "../../services/documentService";
import fieldUpdateService, { FieldUpdate } from "../../services/fieldUpdateService";
import { QuoteCard } from "../../components/client/QuoteCard";
import { QuoteAcceptModal } from "../../components/client/QuoteAcceptModal";
import { QuoteRejectModal } from "../../components/client/QuoteRejectModal";
import { MonInstallationCard } from "../../components/client/MonInstallationCard";

export function ClientProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptModal, setAcceptModal] = useState<Quote | null>(null);
  const [rejectModal, setRejectModal] = useState<Quote | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [latestFieldUpdate, setLatestFieldUpdate] = useState<FieldUpdate | null>(null);
  const [recentPhotos, setRecentPhotos] = useState<{ url: string; date: string; caption?: string | null }[]>([]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [proj, projQuotes, projDocs] = await Promise.all([
        projectService.getProject(Number(id)),
        quoteService.getProjectQuotes(Number(id)).catch(() => [] as Quote[]),
        documentService.getDocumentsByProject(Number(id)).catch(() => []),
      ]);
      setProject(proj);
      setQuotes(projQuotes);
      setDocuments(projDocs);

      const updates = await fieldUpdateService
        .getFieldUpdates(Number(id))
        .catch(() => [] as FieldUpdate[]);
      setLatestFieldUpdate(updates[0] ?? null);
      setRecentPhotos(
        updates
          .filter((u) => !!u.photoUrl)
          .slice(0, 4)
          .map((u) => ({ url: u.photoUrl as string, date: u.createdAt, caption: u.note }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAccept = async () => {
    if (!acceptModal) return;
    setActionLoading(true);
    try {
      await quoteService.acceptQuote(acceptModal.id);
      toast.success("Devis accepté. La facture sera générée automatiquement.");
      setAcceptModal(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Impossible d'accepter le devis");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      await quoteService.rejectQuote(rejectModal.id, { rejectionReason: reason });
      toast.success("Devis refusé");
      setRejectModal(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Impossible de refuser le devis");
    } finally {
      setActionLoading(false);
    }
  };

  const stepMap: Record<string, ProjectStep> = {
    CREATED: "STUDY",
    EN_PREPARATION: "STUDY",
    INSTALLATEUR_AFFECTE: "VALIDATION",
    IN_PROGRESS: "INSTALLATION",
    COMPLETED: "COMPLETED",
    CANCELLED: "STUDY",
  };

  const completedStepsMap: Record<string, ProjectStep[]> = {
    CREATED: [],
    EN_PREPARATION: [],
    INSTALLATEUR_AFFECTE: ["STUDY"],
    IN_PROGRESS: ["STUDY", "VALIDATION"],
    COMPLETED: ["STUDY", "VALIDATION", "INSTALLATION", "COMMISSIONING", "COMPLETED"],
    CANCELLED: [],
  };

  const productionData = [
    { month: "Oct", production: 680, target: 700 },
    { month: "Nov", production: 720, target: 700 },
    { month: "Déc", production: 650, target: 700 },
    { month: "Jan", production: 780, target: 700 },
    { month: "Fév", production: 810, target: 700 },
    { month: "Mar", production: 850, target: 700 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-gray-500">
        Projet introuvable.
        <Link to="/client/projects" className="ml-2 text-primary">
          Retour
        </Link>
      </div>
    );
  }

  const status = project.status;

  return (
    <div className="space-y-6">
      <Link
        to="/client/projects"
        className="inline-flex items-center text-gray-600 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour aux projets
      </Link>

      {/* Project Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-secondary">{project.name}</h1>
              <StatusBadge status={status} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {project.location}
                </span>
              )}
              {project.peakPower && (
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  {project.peakPower} kWc
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Créé le {new Date(project.createdAt).toLocaleDateString("fr-TN")}
              </span>
            </div>
          </div>
        </div>

        <ProjectStepper
          currentStep={stepMap[status] ?? "STUDY"}
          completedSteps={completedStepsMap[status] ?? []}
        />
      </motion.div>

      {/* Mon installation — vue terrain client */}
      {((project.currentProgress ?? 0) > 0 || latestFieldUpdate) && (
        <MonInstallationCard
          progressPercent={project.currentProgress ?? latestFieldUpdate?.progressPercent ?? 0}
          currentPhaseLabel={project.currentPhaseLabel ?? latestFieldUpdate?.currentPhaseLabel ?? null}
          latest={latestFieldUpdate}
          recentPhotos={recentPhotos}
        />
      )}

      {/* Devis */}
      {quotes.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-secondary mb-4">Devis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                onAccept={() => setAcceptModal(q)}
                onReject={() => setRejectModal(q)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-secondary mb-4">Documents</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary">{doc.name}</p>
                    <p className="text-sm text-gray-500">
                      {doc.type} • {doc.size ?? ""}
                    </p>
                  </div>
                </div>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {acceptModal && (
        <QuoteAcceptModal
          quoteNumber={acceptModal.quoteNumber}
          totalAmount={acceptModal.totalAmount}
          onConfirm={handleAccept}
          onClose={() => setAcceptModal(null)}
          isLoading={actionLoading}
        />
      )}

      {rejectModal && (
        <QuoteRejectModal
          quoteNumber={rejectModal.quoteNumber}
          onConfirm={handleReject}
          onClose={() => setRejectModal(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}
