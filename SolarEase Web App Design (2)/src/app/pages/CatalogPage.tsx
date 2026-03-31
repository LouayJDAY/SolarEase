import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { AddEquipmentModal } from "../components/AddEquipmentModal";
import { Link } from "react-router";
import {
  Search,
  LayoutGrid,
  List,
  Eye,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import equipmentService from "../services/equipmentService";

/* ── Equipment data ──────────────────────────────────────────── */

interface Equipment {
  id: string;
  name: string;
  brand: string;
  type: string;
  typeBadge: { label: string; bg: string; text: string };
  power: string;
  efficiency: string;
  price: string;
  warranty: string;
  image?: string;
}

const typeBadgeMap: Record<string, { label: string; bg: string; text: string }> = {
  SOLAR_PANEL: { label: "Panneau", bg: "#E8F5E9", text: "#2E7D32" },
  NIGHT_PANEL: { label: "Night Panel", bg: "#EDE7F6", text: "#4527A0" },
  INVERTER: { label: "Onduleur", bg: "#E3F2FD", text: "#1565C0" },
  BATTERY: { label: "Batterie", bg: "#FFF3E0", text: "#E65100" },
  MOUNTING_SYSTEM: { label: "Montage", bg: "#F5F5F5", text: "#616161" },
  CABLE: { label: "Câble", bg: "#F3E5F5", text: "#7B1FA2" },
  PROTECTION: { label: "Protection", bg: "#FFEBEE", text: "#C62828" },
};

const tabs = [
  { key: "all", label: "Tous" },
  { key: "SOLAR_PANEL", label: "Panneaux" },
  { key: "NIGHT_PANEL", label: "Night Panels 🌙" },
  { key: "INVERTER", label: "Onduleurs" },
  { key: "BATTERY", label: "Batteries" },
  { key: "MOUNTING_SYSTEM", label: "Montage" },
  { key: "CABLE", label: "Câbles" },
  { key: "PROTECTION", label: "Protection" },
];

/* ── Page component ──────────────────────────────────────────── */

export function CatalogPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const data =
        activeTab === "all"
          ? await equipmentService.getAll()
          : await equipmentService.getByType(activeTab);
      const mapped: Equipment[] = (Array.isArray(data) ? data : []).map((e: any) => ({
        id: String(e.id),
        name: e.name || e.model || "",
        brand: e.brand || e.manufacturer || "",
        type: e.type || "SOLAR_PANEL",
        typeBadge: typeBadgeMap[e.type] || typeBadgeMap.SOLAR_PANEL,
        power: e.power ? `${e.power}W` : e.capacity ? `${e.capacity} kWh` : "—",
        efficiency: e.efficiency ? `${e.efficiency}%` : "—",
        price: e.price ? String(e.price) : "—",
        warranty: e.warranty ? `${e.warranty} ans` : "—",
      }));
      setEquipment(mapped);
    } catch (err) {
      console.error("Error fetching equipment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet équipement ?")) return;
    try {
      await equipmentService.delete(Number(id));
      fetchEquipment();
    } catch (err) {
      console.error("Error deleting equipment:", err);
    }
  };

  const filtered = equipment.filter((e) => {
    const matchSearch =
      search === "" ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.brand.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-5">
          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Catalogue</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gérez vos équipements solaires
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: "#4CAF50" }}
            >
              <Plus className="w-4 h-4" />
              Ajouter un équipement
            </button>
          </div>

          {/* ── Filters row ── */}
          <div
            className="bg-white rounded-xl p-4 flex flex-col lg:flex-row gap-4 lg:items-center justify-between"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            {/* Tabs */}
            <div className="flex flex-wrap gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === t.key
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={
                    activeTab === t.key
                      ? { backgroundColor: "#4CAF50" }
                      : undefined
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
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
              {/* View toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
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

          {/* ── Grid View ── */}
          {view === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((eq) => (
                <div
                  key={eq.id}
                  className="bg-white rounded-xl overflow-hidden group hover:shadow-md transition-shadow"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                >
                  {/* Image placeholder */}
                  <div className="h-40 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: eq.typeBadge.bg,
                        color: eq.typeBadge.text,
                      }}
                    >
                      {eq.typeBadge.label}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 mt-2 truncate">
                      {eq.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{eq.brand}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-sm font-bold" style={{ color: "#4CAF50" }}>
                        {eq.price} <span className="text-xs font-normal text-gray-400">TND</span>
                      </span>
                      <div className="flex gap-1">
                        <Link
                          to={`/catalog/${eq.id}`}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-[#4CAF50] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(eq.id)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── List / Table View ── */}
          {view === "list" && (
            <div
              className="bg-white rounded-xl overflow-hidden"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    {["Équipement", "Type", "Puissance", "Rendement", "Prix (TND)", "Garantie", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          <span className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                            {h}
                            <SlidersHorizontal className="w-3 h-3 opacity-40" />
                          </span>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((eq, idx) => (
                    <tr
                      key={eq.id}
                      className="border-b border-gray-50 hover:bg-green-50/40 transition-colors"
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {eq.name}
                            </p>
                            <p className="text-xs text-gray-400">{eq.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: eq.typeBadge.bg,
                            color: eq.typeBadge.text,
                          }}
                        >
                          {eq.typeBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{eq.power}</td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {eq.efficiency}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {eq.price}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {eq.warranty}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/catalog/${eq.id}`}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-[#4CAF50] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(eq.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Affichage 1-{filtered.length} sur 24
            </span>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === 1
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={p === 1 ? { backgroundColor: "#4CAF50" } : undefined}
                >
                  {p}
                </button>
              ))}
              <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <AddEquipmentModal onClose={() => setShowAddModal(false)} onSuccess={fetchEquipment} />
      )}
    </div>
  );
}
