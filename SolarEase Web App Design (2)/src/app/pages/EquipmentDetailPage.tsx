import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { Link, useParams, useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import equipmentService, { EquipmentResponse } from "../services/equipmentService";

const typeLabelMap: Record<string, string> = {
  PANEL: "Panneau Solaire",
  INVERTER: "Onduleur",
  BATTERY: "Batterie",
  MOUNTING: "Structure de Montage",
  CABLE: "Câble",
  PROTECTION: "Protection",
};

const categoryPathMap: Record<string, string> = {
  PANEL: "Panneaux",
  INVERTER: "Onduleurs",
  BATTERY: "Batteries",
  MOUNTING: "Structures",
  CABLE: "Câbles",
  PROTECTION: "Protections",
};

export function EquipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<EquipmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    equipmentService
      .getById(Number(id))
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!product) return;
    if (!window.confirm(`Supprimer l'équipement "${product.name}" ?`)) return;
    try {
      await equipmentService.delete(product.id);
      navigate("/catalog");
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 flex items-center justify-center h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#4CAF50]" />
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-16 flex flex-col items-center justify-center h-[80vh] gap-4">
          <p className="text-lg text-gray-500">Équipement introuvable</p>
          <Link to="/catalog" className="text-[#4CAF50] hover:underline font-medium">
            ← Retour au catalogue
          </Link>
        </main>
      </div>
    );
  }

  const specs = [
    { label: "Puissance", value: product.power || "—" },
    { label: "Rendement", value: product.efficiency || "—" },
    { label: "Garantie", value: product.warranty ? `${product.warranty} ans` : "—" },
    { label: "Marque", value: product.brand || "—" },
  ].filter((s) => s.value !== "—");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAFA" }}>
      <Sidebar />
      <TopBar />

      <main className="ml-64 pt-16">
        <div className="p-6 space-y-5">
          {/* ── Breadcrumb ── */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link to="/catalog" className="hover:text-[#4CAF50]">
              Catalogue
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{categoryPathMap[product.type] || product.type}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-xs">
              {product.name}
            </span>
          </div>

          <Link
            to="/catalog"
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            style={{ color: "#4CAF50" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
          </Link>

          {/* ── Product section (2-col) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left – Image 40% */}
            <div className="lg:col-span-2 space-y-3">
              <div
                className="bg-white rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  height: 340,
                  backgroundColor: "#F5F5F5",
                }}
              >
                {/* Solar panel illustration */}
                <svg viewBox="0 0 120 80" className="w-48 h-32 text-gray-300">
                  <rect
                    x="10"
                    y="5"
                    width="100"
                    height="65"
                    rx="4"
                    fill="#E0E0E0"
                    stroke="#BDBDBD"
                    strokeWidth="1"
                  />
                  {[0, 1, 2, 3].map((r) =>
                    [0, 1, 2, 3, 4].map((c) => (
                      <rect
                        key={`${r}-${c}`}
                        x={14 + c * 19}
                        y={9 + r * 15}
                        width={16}
                        height={12}
                        rx="1"
                        fill="#BDBDBD"
                        stroke="#A0A0A0"
                        strokeWidth="0.3"
                      />
                    ))
                  )}
                </svg>
              </div>
              {/* Thumbnails */}
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 bg-gray-100 rounded-lg border-2 cursor-pointer hover:border-[#4CAF50] transition-colors"
                    style={{
                      borderColor: i === 1 ? "#4CAF50" : "#E0E0E0",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Right – Details 60% */}
            <div className="lg:col-span-3 space-y-5">
              <div
                className="bg-white rounded-xl p-6"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
              >
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                  style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
                >
                  {typeLabelMap[product.type] || product.type}
                </span>
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h1>
                <p className="text-gray-500 mt-1">{product.brand}</p>

                <div className="flex items-baseline gap-1.5 mt-4">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: "#4CAF50" }}
                  >
                    {product.price} TND
                  </span>
                  <span className="text-sm text-gray-400">HT</span>
                </div>

                <hr className="my-5 border-gray-100" />

                {/* Specs table */}
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Caractéristiques techniques
                </h3>
                {specs.length > 0 ? (
                <div className="space-y-0 rounded-lg overflow-hidden border border-gray-100">
                  {specs.map((s, i) => (
                    <div
                      key={i}
                      className="flex justify-between px-4 py-2.5 text-sm"
                      style={{
                        backgroundColor: i % 2 === 0 ? "#FAFAFA" : "#fff",
                      }}
                    >
                      <span className="text-gray-500">{s.label}</span>
                      <span className="font-medium text-gray-900">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
                ) : (
                  <p className="text-sm text-gray-400">Aucune caractéristique renseignée</p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors hover:bg-green-50"
                    style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium border-2 border-red-400 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          <div
            className="bg-white rounded-xl p-6"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
          >
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Description
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description || "Aucune description disponible."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
