import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Plus,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Eye,
  User as UserIcon,
  RotateCcw,
  Sparkles,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { QuoteKpiCards } from "../components/QuoteKpiCards";
import { QuoteFilterBar, QuoteStatusFilter } from "../components/QuoteFilterBar";
import { QuoteList } from "../components/QuoteList";

import quoteService, { Quote, QuoteCreateRequest } from "../services/quoteService";
import projectService, { ProjectResponse } from "../services/projectService";
import catalogService, { CatalogCategory, CatalogProduct } from "../services/catalogService";
import dimensioningService from "../services/dimensioningService";
import {
  buildQuotePrefillFromDimensioning,
  computeTva,
  getLatestDimensioning,
  TVA_RATE,
} from "../utils/quoteFromDimensioning";
import { useAuth } from "../context/AuthContext";

const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  MATERIEL: "Materiel",
  MAIN_OEUVRE: "Main d'oeuvre",
  TRANSPORT: "Transport",
  AUTRE: "Autre",
};

const CATEGORY_COLORS: Record<CatalogCategory, string> = {
  MATERIEL: "bg-blue-50 text-blue-700 border-blue-200",
  MAIN_OEUVRE: "bg-amber-50 text-amber-700 border-amber-200",
  TRANSPORT: "bg-purple-50 text-purple-700 border-purple-200",
  AUTRE: "bg-slate-50 text-slate-700 border-slate-200",
};

interface AddedItem {
  id: number;
  name: string;
  price: number;
  category: CatalogCategory;
}

const emptyForm: QuoteCreateRequest = {
  projectId: 0,
  laborCost: 0,
  materialsCost: 0,
  tax: 0,
  description: "",
  notes: "",
};

export function QuotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createForProjectId = Number(searchParams.get("createFor") || 0);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [form, setForm] = useState<QuoteCreateRequest>(emptyForm);
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [prefillSource, setPrefillSource] = useState<{
    dimensioningId: number;
    dimensioningDate: string;
  } | null>(null);
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<string>("");
  const [catalogItems, setCatalogItems] = useState<CatalogProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>("ALL");
  const [installerFilter, setInstallerFilter] = useState<string>("ALL");

  const formRef = useRef<HTMLDivElement | null>(null);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const page = isAdmin
        ? await quoteService.getAllQuotes(0, 200)
        : await quoteService.getInstallerQuotes(0, 200);
      setQuotes(page.content || []);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les devis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    let mounted = true;
    setLoadingProjects(true);
    projectService
      .getAllProjects({ page: 0, size: 200 })
      .then((p) => {
        if (mounted) setProjects(p.content || []);
      })
      .catch(() => {
        if (mounted) setProjects([]);
      })
      .finally(() => {
        if (mounted) setLoadingProjects(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const applyPrefillFromProject = async (
    projectId: number,
    options?: { silent?: boolean }
  ) => {
    if (!projectId || projectId <= 0) return false;
    setLoadingPrefill(true);
    try {
      const dimensionings = await dimensioningService.getByProject(projectId);
      const latest = getLatestDimensioning(dimensionings);
      if (!latest) {
        setPrefillSource(null);
        if (!options?.silent) {
          toast.error("Aucun dimensionnement trouve pour ce projet");
        }
        return false;
      }

      const prefill = buildQuotePrefillFromDimensioning(latest);
      setForm((prev) => ({
        ...prev,
        projectId,
        description: prefill.form.description,
        laborCost: prefill.form.laborCost,
        materialsCost: prefill.form.materialsCost,
        tax: prefill.form.tax,
        notes: prefill.form.notes,
      }));
      setPrefillSource({
        dimensioningId: prefill.dimensioningId,
        dimensioningDate: prefill.dimensioningDate,
      });
      if (!options?.silent) {
        toast.success("Devis pre-rempli depuis le dimensionnement");
      }
      return true;
    } catch {
      setPrefillSource(null);
      if (!options?.silent) {
        toast.error("Impossible de charger le dimensionnement");
      }
      return false;
    } finally {
      setLoadingPrefill(false);
    }
  };

  useEffect(() => {
    if (!createForProjectId) return;
    setForm((prev) => ({ ...prev, projectId: createForProjectId }));
    setShowForm(true);
    void applyPrefillFromProject(createForProjectId, { silent: true }).then((ok) => {
      if (ok) {
        toast.success("Devis pre-rempli depuis le dimensionnement du projet");
      }
    });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createForProjectId]);

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const results = await catalogService.search(
        catalogSearch || undefined,
        catalogCategory || undefined
      );
      setCatalogItems(results);
    } catch {
      setCatalogItems([]);
      toast.error("Impossible de charger le catalogue produits");
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (!showCatalog) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchCatalog(), 250);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCatalog, catalogSearch, catalogCategory]);

  const selectedProject = projects.find((p) => p.id === form.projectId);
  const linkedClient = selectedProject?.client;

  const applyAutoTva = (
    prev: QuoteCreateRequest,
    patch: Partial<QuoteCreateRequest>
  ): QuoteCreateRequest => {
    const next = { ...prev, ...patch };
    if (prefillSource) {
      next.tax = computeTva((next.laborCost ?? 0) + (next.materialsCost ?? 0));
    }
    return next;
  };

  const total = (form.laborCost ?? 0) + (form.materialsCost ?? 0) + (form.tax ?? 0);

  const installerOptions = useMemo(() => {
    if (!isAdmin) return [];
    const seen = new Map<string, string>();
    quotes.forEach((q) => {
      if (!q.installerId) return;
      if (!seen.has(q.installerId)) {
        seen.set(q.installerId, q.installerId.slice(0, 8));
      }
    });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [quotes, isAdmin]);

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (statusFilter !== "ALL" && quote.status !== statusFilter) return false;
      if (isAdmin && installerFilter !== "ALL" && quote.installerId !== installerFilter) return false;
      if (q.length === 0) return true;
      const haystack = [
        quote.quoteNumber,
        quote.projectName,
        String(quote.projectId),
        quote.clientFirstName,
        quote.clientLastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [quotes, search, statusFilter, installerFilter, isAdmin]);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<QuoteStatusFilter, number>> = { ALL: quotes.length };
    quotes.forEach((q) => {
      counts[q.status] = (counts[q.status] ?? 0) + 1;
    });
    return counts;
  }, [quotes]);

  const handleAddFromCatalog = (product: CatalogProduct) => {
    setAddedItems((prev) => {
      if (prev.some((i) => i.id === product.id)) return prev;
      return [
        ...prev,
        { id: product.id, name: product.name, price: product.defaultPrice, category: product.category },
      ];
    });
    setForm((prev) => {
      const isMaterial =
        product.category === "MATERIEL" ||
        product.category === "TRANSPORT" ||
        product.category === "AUTRE";
      return applyAutoTva(prev, {
        materialsCost: isMaterial
          ? (prev.materialsCost ?? 0) + product.defaultPrice
          : prev.materialsCost,
        laborCost:
          product.category === "MAIN_OEUVRE"
            ? (prev.laborCost ?? 0) + product.defaultPrice
            : prev.laborCost,
      });
    });
  };

  const handleRemoveItem = (item: AddedItem) => {
    setAddedItems((prev) => prev.filter((i) => i.id !== item.id));
    setForm((prev) => {
      const isMaterial =
        item.category === "MATERIEL" || item.category === "TRANSPORT" || item.category === "AUTRE";
      return applyAutoTva(prev, {
        materialsCost: isMaterial
          ? Math.max(0, (prev.materialsCost ?? 0) - item.price)
          : prev.materialsCost,
        laborCost:
          item.category === "MAIN_OEUVRE"
            ? Math.max(0, (prev.laborCost ?? 0) - item.price)
            : prev.laborCost,
      });
    });
  };

  const handleReset = () => {
    setForm(emptyForm);
    setAddedItems([]);
    setPrefillSource(null);
  };

  const handleProjectChange = (projectId: number) => {
    setForm((f) => {
      const isEmpty =
        (f.laborCost ?? 0) === 0 &&
        (f.materialsCost ?? 0) === 0 &&
        !f.description?.trim();

      if (projectId > 0 && isEmpty) {
        void applyPrefillFromProject(projectId, { silent: true });
      } else {
        setPrefillSource(null);
      }

      return { ...f, projectId };
    });
  };

  const handlePreview = () => {
    quoteService.previewQuotePdf({
      projectId: form.projectId,
      description: form.description,
      laborCost: form.laborCost ?? 0,
      materialsCost: form.materialsCost ?? 0,
      tax: form.tax ?? 0,
      totalAmount: total,
      notes: form.notes,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId || form.projectId <= 0) {
      toast.error("Veuillez selectionner un projet");
      return;
    }
    if ((form.laborCost ?? 0) + (form.materialsCost ?? 0) <= 0) {
      toast.error("Le total doit etre superieur a 0");
      return;
    }

    setCreating(true);
    try {
      await quoteService.createQuote(form);
      toast.success("Devis cree");
      handleReset();
      await loadQuotes();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Creation impossible");
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (quoteId: number) => {
    try {
      await quoteService.sendQuote(quoteId);
      toast.success("Devis envoye au client");
      await loadQuotes();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Envoi impossible");
    }
  };

  const handleDelete = async (quoteId: number) => {
    if (!window.confirm("Supprimer ce devis ?")) return;
    try {
      await quoteService.deleteQuote(quoteId);
      toast.success("Devis supprime");
      await loadQuotes();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Suppression impossible");
    }
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-secondary">
              {isAdmin ? "Devis - vue globale" : "Devis & Facturation"}
            </h1>
            <p className="text-sm text-slate-500">
              {isAdmin
                ? "Supervision globale et creation de devis pour tous les projets."
                : "Creez, envoyez et suivez vos devis installateur."}
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={handleOpenForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouveau devis
            </button>
          )}
        </div>

        <QuoteKpiCards quotes={quotes} variant={isAdmin ? "admin" : "installer"} />

        <QuoteFilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          installerFilter={installerFilter}
          onInstallerFilterChange={setInstallerFilter}
          installerOptions={installerOptions}
          showInstallerFilter={isAdmin}
          showCounts={statusCounts}
        />

        {showForm && (
          <section
            ref={formRef}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm scroll-mt-24"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-secondary flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nouveau devis
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Fermer le formulaire"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              {prefillSource && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-2 text-sm text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Pre-rempli depuis le dimensionnement #{prefillSource.dimensioningId}{" "}
                      ({new Date(prefillSource.dimensioningDate).toLocaleDateString("fr-TN")}).
                      Vous pouvez ajuster les montants avant envoi.
                    </span>
                  </div>
                  {form.projectId > 0 && (
                    <button
                      type="button"
                      onClick={() => void applyPrefillFromProject(form.projectId)}
                      disabled={loadingPrefill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-800 text-xs font-medium hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {loadingPrefill ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      Reimporter
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Projet
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select
                    value={form.projectId}
                    onChange={(e) => handleProjectChange(Number(e.target.value))}
                    className="md:col-span-2 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                  >
                    <option value={0}>
                      {loadingProjects
                        ? "Chargement des projets..."
                        : "-- Selectionner un projet --"}
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Ou ID"
                    value={form.projectId || ""}
                    onChange={(e) => handleProjectChange(Number(e.target.value))}
                    className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                {linkedClient && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <UserIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm text-emerald-800">
                      Client associe :{" "}
                      <span className="font-semibold">
                        {linkedClient.firstName} {linkedClient.lastName}
                      </span>
                    </span>
                  </div>
                )}
                {form.projectId > 0 && !loadingProjects && !linkedClient && (
                  <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-sm text-amber-700">
                      Aucun client associe a ce projet.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Description des travaux..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCatalog((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Catalogue de produits
                    {addedItems.length > 0 && (
                      <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {addedItems.length}
                      </span>
                    )}
                  </div>
                  {showCatalog ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showCatalog && (
                  <div className="p-4 border-t border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          placeholder="Rechercher un produit..."
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                      </div>
                      <select
                        value={catalogCategory}
                        onChange={(e) => setCatalogCategory(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                      >
                        <option value="">Toutes categories</option>
                        {(Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {loadingCatalog ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          Chargement...
                        </p>
                      ) : catalogItems.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">
                          Aucun produit trouve.
                        </p>
                      ) : (
                        catalogItems.map((product) => {
                          const alreadyAdded = addedItems.some((i) => i.id === product.id);
                          return (
                            <div
                              key={product.id}
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                alreadyAdded
                                  ? "bg-emerald-50 border-emerald-200"
                                  : "bg-white border-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-secondary truncate">
                                    {product.name}
                                  </span>
                                  {product.reference && (
                                    <span className="text-xs text-slate-400 font-mono shrink-0">
                                      {product.reference}
                                    </span>
                                  )}
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${CATEGORY_COLORS[product.category]}`}
                                  >
                                    {CATEGORY_LABELS[product.category]}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-semibold text-secondary whitespace-nowrap">
                                  {product.defaultPrice.toLocaleString("fr-TN")} TND
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddFromCatalog(product)}
                                  disabled={alreadyAdded}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    alreadyAdded
                                      ? "text-emerald-600 bg-emerald-100 cursor-not-allowed"
                                      : "text-white bg-primary hover:bg-primary/90"
                                  }`}
                                  title={alreadyAdded ? "Deja ajoute" : "Ajouter au devis"}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {addedItems.length > 0 && (
                      <div className="border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          Produits ajoutes
                        </p>
                        <div className="space-y-1">
                          {addedItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-slate-700 truncate mr-2">
                                {item.name}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-slate-500">
                                  {item.price.toLocaleString("fr-TN")} TND
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item)}
                                  className="text-rose-400 hover:text-rose-600 transition-colors"
                                  title="Retirer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Main d'oeuvre (TND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.laborCost ?? 0}
                    onChange={(e) =>
                      setForm((f) =>
                        applyAutoTva(f, { laborCost: parseFloat(e.target.value) || 0 })
                      )
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Materiaux (TND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.materialsCost ?? 0}
                    onChange={(e) =>
                      setForm((f) =>
                        applyAutoTva(f, { materialsCost: parseFloat(e.target.value) || 0 })
                      )
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Taxes / TVA {Math.round(TVA_RATE * 100)}% (TND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.tax ?? 0}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tax: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-50 to-primary/5 border border-slate-200 rounded-xl p-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Main d'oeuvre</span>
                    <span>{(form.laborCost ?? 0).toLocaleString("fr-TN")} TND</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Materiaux</span>
                    <span>{(form.materialsCost ?? 0).toLocaleString("fr-TN")} TND</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Taxes / TVA ({Math.round(TVA_RATE * 100)}%)</span>
                    <span>{(form.tax ?? 0).toLocaleString("fr-TN")} TND</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                    <span className="font-semibold text-secondary">Total TTC</span>
                    <span className="text-xl font-bold text-primary">
                      {total.toLocaleString("fr-TN")} TND
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Notes internes
                </label>
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Notes optionnelles (non visibles par le client)..."
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reinitialiser
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-primary/40 text-primary rounded-lg hover:bg-primary/5 transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Apercu PDF
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {creating ? "Creation..." : "Creer le devis"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary">
              {isAdmin ? "Tous les devis" : "Mes devis"}
            </h2>
            <span className="text-sm text-slate-500">
              {filteredQuotes.length} / {quotes.length}
            </span>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">Chargement des devis...</p>
            </div>
          ) : (
            <QuoteList
              quotes={filteredQuotes}
              role={isAdmin ? "ADMIN" : "INSTALLER"}
              onSend={handleSend}
              onDelete={handleDelete}
              onPreviewPdf={(q) => quoteService.printQuotePdf(q)}
              onOpenDetail={(q) => navigate(`/quotes/${q.id}`)}
              emptyMessage={
                quotes.length === 0
                  ? "Aucun devis pour le moment. Cliquez sur « Nouveau devis » pour commencer."
                  : "Aucun devis ne correspond aux filtres."
              }
            />
          )}
        </section>
      </main>
    </div>
  );
}
