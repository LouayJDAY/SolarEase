import React, { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Eye, Plus, Search, Sparkles, User, X } from "lucide-react";
import type { QuoteCreateRequest } from "../services/quoteService";
import quoteService from "../services/quoteService";
import projectService, { ProjectResponse } from "../services/projectService";
import catalogService, { CatalogProduct, CatalogCategory } from "../services/catalogService";
import dimensioningService from "../services/dimensioningService";
import {
  buildQuotePrefillFromDimensioning,
  getLatestDimensioning,
} from "../utils/quoteFromDimensioning";
import { useAuth } from "../context/AuthContext";
import { quoteFormSchema } from "../validation/commerceSchemas";
import { toast } from "sonner";

interface Props {
  projectId: number;
  onSubmit: (data: QuoteCreateRequest) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const CATEGORY_LABELS: Record<CatalogCategory, string> = {
  MATERIEL: "Matériel",
  MAIN_OEUVRE: "Main d'œuvre",
  TRANSPORT: "Transport",
  AUTRE: "Autre",
};

const CATEGORY_COLORS: Record<CatalogCategory, string> = {
  MATERIEL: "bg-blue-50 text-blue-700 border-blue-200",
  MAIN_OEUVRE: "bg-amber-50 text-amber-700 border-amber-200",
  TRANSPORT: "bg-purple-50 text-purple-700 border-purple-200",
  AUTRE: "bg-gray-50 text-gray-700 border-gray-200",
};

interface AddedItem {
  id: number;
  name: string;
  price: number;
  category: CatalogCategory;
}

export function QuoteForm({ projectId, onSubmit, onClose, isLoading }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<QuoteCreateRequest>({
    projectId,
    description: "",
    laborCost: 0,
    materialsCost: 0,
    tax: 0,
    notes: "",
  });

  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Catalog state
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<string>("");
  const [catalogItems, setCatalogItems] = useState<CatalogProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);
  const [prefillSource, setPrefillSource] = useState<number | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedProject = projects.find((p) => p.id === form.projectId);
  const linkedClient = selectedProject?.client;

  const total = (form.laborCost ?? 0) + (form.materialsCost ?? 0) + (form.tax ?? 0);

  useEffect(() => {
    let mounted = true;
    setLoadingProjects(true);
    const load = user?.role === "ADMIN"
      ? projectService.getAllProjects({ page: 0, size: 100 })
      : projectService.getProjects({ page: 0, size: 100 });
    load
      .then((p) => { if (mounted) setProjects(p.content || []); })
      .catch(() => { if (mounted) setProjects([]); })
      .finally(() => { if (mounted) setLoadingProjects(false); });
    return () => { mounted = false; };
  }, [user?.role]);

  useEffect(() => {
    if (!projectId || projectId <= 0) return;
    let mounted = true;
    projectService
      .getProject(projectId)
      .then((p) => {
        if (!mounted) return;
        setProjects((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || projectId <= 0) return;
    let mounted = true;
    dimensioningService
      .getByProject(projectId)
      .then((dims) => {
        if (!mounted) return;
        const latest = getLatestDimensioning(dims);
        if (!latest) return;
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
        setPrefillSource(prefill.dimensioningId);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [projectId]);

  // Load catalog when section opens
  useEffect(() => {
    if (!showCatalog) return;
    fetchCatalog();
  }, [showCatalog]);

  // Debounced catalog search
  useEffect(() => {
    if (!showCatalog) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchCatalog(), 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [catalogSearch, catalogCategory]);

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const results = await catalogService.search(catalogSearch || undefined, catalogCategory || undefined);
      setCatalogItems(results);
    } catch {
      setCatalogItems([]);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleAddFromCatalog = (product: CatalogProduct) => {
    setAddedItems((prev) => {
      const alreadyAdded = prev.find((i) => i.id === product.id);
      if (alreadyAdded) return prev;
      return [...prev, { id: product.id, name: product.name, price: product.defaultPrice, category: product.category }];
    });
    setForm((prev) => {
      const isMaterial = product.category === "MATERIEL" || product.category === "TRANSPORT" || product.category === "AUTRE";
      return {
        ...prev,
        materialsCost: isMaterial
          ? (prev.materialsCost ?? 0) + product.defaultPrice
          : prev.materialsCost,
        laborCost: product.category === "MAIN_OEUVRE"
          ? (prev.laborCost ?? 0) + product.defaultPrice
          : prev.laborCost,
      };
    });
  };

  const handleRemoveAddedItem = (item: AddedItem) => {
    setAddedItems((prev) => prev.filter((i) => i.id !== item.id));
    setForm((prev) => {
      const isMaterial = item.category === "MATERIEL" || item.category === "TRANSPORT" || item.category === "AUTRE";
      return {
        ...prev,
        materialsCost: isMaterial
          ? Math.max(0, (prev.materialsCost ?? 0) - item.price)
          : prev.materialsCost,
        laborCost: item.category === "MAIN_OEUVRE"
          ? Math.max(0, (prev.laborCost ?? 0) - item.price)
          : prev.laborCost,
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "laborCost" || name === "materialsCost" || name === "tax"
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handlePreview = () => {
    quoteService.previewQuotePdf({
      quoteNumber: undefined,
      projectId: form.projectId,
      description: form.description,
      laborCost: form.laborCost ?? 0,
      materialsCost: form.materialsCost ?? 0,
      tax: form.tax ?? 0,
      totalAmount: total,
      notes: form.notes,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = quoteFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides.");
      return;
    }
    await onSubmit(parsed.data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-secondary">Nouveau devis</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {prefillSource && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Pré-rempli depuis le dimensionnement #{prefillSource}.</span>
            </div>
          )}

          {/* Project selector */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Projet (sélectionner un projet existant)
            </label>
            <div className="flex gap-2">
              <select
                name="projectId"
                value={form.projectId}
                onChange={(e) => setForm((s) => ({ ...s, projectId: Number(e.target.value) }))}
                className="w-2/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={0}>-- Sélectionner un projet --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={form.projectId || ""}
                onChange={(e) => setForm((s) => ({ ...s, projectId: Number(e.target.value) }))}
                placeholder="Ou saisir ID"
                className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {linkedClient && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <User className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm text-emerald-800 font-medium">
                  Client associé :&nbsp;
                  <span className="font-semibold">{linkedClient.firstName} {linkedClient.lastName}</span>
                </span>
              </div>
            )}
            {form.projectId > 0 && !loadingProjects && !linkedClient && (
              <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-sm text-amber-700">Aucun client associé à ce projet.</span>
              </div>
            )}

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none mt-3"
              placeholder="Description des travaux..."
            />
          </div>

          {/* ── CATALOGUE DE PRODUITS ── */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
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
              {showCatalog ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {showCatalog && (
              <div className="p-4 border-t border-gray-200 space-y-3">
                {/* Search + filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Rechercher un produit..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <select
                    value={catalogCategory}
                    onChange={(e) => setCatalogCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Toutes catégories</option>
                    {(Object.keys(CATEGORY_LABELS) as CatalogCategory[]).map((cat) => (
                      <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>

                {/* Products list */}
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {loadingCatalog ? (
                    <p className="text-xs text-gray-400 text-center py-4">Chargement...</p>
                  ) : catalogItems.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Aucun produit trouvé.</p>
                  ) : catalogItems.map((product) => {
                    const alreadyAdded = addedItems.some((i) => i.id === product.id);
                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
                          alreadyAdded ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-secondary truncate">{product.name}</span>
                            {product.reference && (
                              <span className="text-xs text-gray-400 font-mono shrink-0">{product.reference}</span>
                            )}
                            <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${CATEGORY_COLORS[product.category]}`}>
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
                            title={alreadyAdded ? "Déjà ajouté" : "Ajouter au devis"}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Added items summary */}
                {addedItems.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Produits ajoutés
                    </p>
                    <div className="space-y-1">
                      {addedItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate mr-2">{item.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-gray-500">{item.price.toLocaleString("fr-TN")} TND</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAddedItem(item)}
                              className="text-red-400 hover:text-red-600 transition-colors"
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

          {/* Costs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Main d'œuvre (TND)</label>
              <input
                type="number"
                name="laborCost"
                value={form.laborCost}
                onChange={handleChange}
                min={0}
                step={0.01}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Matériaux (TND)</label>
              <input
                type="number"
                name="materialsCost"
                value={form.materialsCost}
                onChange={handleChange}
                min={0}
                step={0.01}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Taxes / TVA (TND)</label>
            <input
              type="number"
              name="tax"
              value={form.tax}
              onChange={handleChange}
              min={0}
              step={0.01}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Main d'œuvre</span>
              <span>{(form.laborCost ?? 0).toLocaleString("fr-TN")} TND</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Matériaux</span>
              <span>{(form.materialsCost ?? 0).toLocaleString("fr-TN")} TND</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Taxes / TVA</span>
              <span>{(form.tax ?? 0).toLocaleString("fr-TN")} TND</span>
            </div>
            <div className="flex justify-between font-bold text-secondary border-t border-gray-200 mt-2 pt-2">
              <span>Total TTC</span>
              <span>{total.toLocaleString("fr-TN")} TND</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Notes internes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Notes optionnelles..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-secondary rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2.5 border border-primary/40 text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
              title="Voir l'aperçu PDF sans enregistrer"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? "Création..." : "Créer le devis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
