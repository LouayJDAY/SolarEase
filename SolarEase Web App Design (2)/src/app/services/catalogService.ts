import api from "./api";

export type CatalogCategory = "MATERIEL" | "MAIN_OEUVRE" | "TRANSPORT" | "AUTRE";

export interface CatalogProduct {
  id: number;
  name: string;
  reference?: string;
  defaultPrice: number;
  category: CatalogCategory;
  description?: string;
}

const categoryLabel: Record<CatalogCategory, string> = {
  MATERIEL: "Matériel",
  MAIN_OEUVRE: "Main d'œuvre",
  TRANSPORT: "Transport",
  AUTRE: "Autre",
};

const catalogService = {
  search: async (q?: string, category?: string): Promise<CatalogProduct[]> => {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (category) params.append("category", category);
    const res = await api.get<CatalogProduct[]>(`/catalog?${params.toString()}`);
    return res.data;
  },

  getCategoryLabel: (cat: CatalogCategory) => categoryLabel[cat] ?? cat,
};

export default catalogService;
