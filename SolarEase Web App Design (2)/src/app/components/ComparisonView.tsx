import React, { useState } from "react";
import {
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  Zap,
  Battery,
  Leaf,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadialBarChart,
  RadialBar,
  Cell,
} from "recharts";
import { ComparisonResponse } from "../services/dimensioningService";

interface ComparisonViewProps {
  data: ComparisonResponse;
}

export function ComparisonView({ data }: ComparisonViewProps) {
  const [chartTab, setChartTab] = useState<"curve" | "financial">("curve");
  const classic = data.classic;
  const night = data.nightPanel;

  // 24h curve data
  const hourlyCurveData = data.nightPanelHourlyCurve.map((h, i) => ({
    hour: `${h.hour}h`,
    productionClassique: data.classicHourlyCurve[i]?.production || 0,
    productionNight: h.production,
    consommation: h.consumption,
    stocké: h.stored,
    déstocké: h.fromStorage,
  }));

  // Self-consumption gauge data
  const selfConsData = [
    {
      name: "Night Panel",
      value: Math.round((night.installation.selfConsumptionRate || 0) * 100),
      fill: "#6366F1",
    },
    {
      name: "Classique",
      value: 30, // Classic ~30%
      fill: "#4CAF50",
    },
  ];

  // Financial comparison
  const financialCompare = [
    {
      label: "Coût initial",
      classic: classic.financials.totalInvestmentCost,
      night: night.financials.totalInvestmentCost,
      unit: "TND",
      lowerBetter: true,
    },
    {
      label: "Économies/an",
      classic: classic.financials.annualSavings,
      night: night.financials.annualSavings,
      unit: "TND",
      lowerBetter: false,
    },
    {
      label: "Payback",
      classic: classic.financials.paybackPeriodYears,
      night: night.financials.paybackPeriodYears,
      unit: "ans",
      lowerBetter: true,
    },
    {
      label: "ROI 25 ans",
      classic: classic.financials.roiPercentage,
      night: night.financials.roiPercentage,
      unit: "%",
      lowerBetter: false,
    },
    {
      label: "Épargne 25 ans",
      classic: classic.financials.netSavings25Years,
      night: night.financials.netSavings25Years,
      unit: "TND",
      lowerBetter: false,
    },
  ];

  const DeltaBadge = ({ value, unit, inverse }: { value: number; unit: string; inverse?: boolean }) => {
    const isPositive = inverse ? value < 0 : value > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
        isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {value > 0 ? "+" : ""}{typeof value === "number" ? value.toLocaleString() : value} {unit}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-indigo-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6" />
          <h2 className="text-xl font-bold">Comparaison : Classique vs Night Panel</h2>
        </div>
        <p className="text-sm text-white/80">
          Analyse côte à côte pour votre projet — surface {classic.installation.panelCount} panneaux,
          {" "}{classic.installation.totalCapacityKw} kWc
        </p>
      </div>

      {/* ── Side by Side Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classic Card */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Sun className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Panneau Classique</h3>
              <p className="text-xs text-gray-500">{classic.installation.panelModel}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Panneaux</span>
              <span className="font-semibold text-gray-900">{classic.installation.panelCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Puissance</span>
              <span className="font-semibold text-gray-900">{classic.installation.totalCapacityKw} kWc</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Production/an</span>
              <span className="font-semibold text-green-600">
                {Math.round(classic.installation.estimatedAnnualProductionKwh).toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Coût</span>
              <span className="font-semibold text-gray-900">
                {Math.round(classic.installation.estimatedCost).toLocaleString()} TND
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Autoconsommation</span>
              <span className="font-semibold text-gray-900">~30%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Stockage</span>
              <span className="font-semibold text-gray-400">Aucun</span>
            </div>
          </div>
        </div>

        {/* Night Panel Card */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-indigo-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
            ⭐ Recommandé
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Night Panel</h3>
              <p className="text-xs text-gray-500">{night.installation.panelModel}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Panneaux</span>
              <span className="font-semibold text-gray-900">{night.installation.panelCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Puissance</span>
              <span className="font-semibold text-gray-900">{night.installation.totalCapacityKw} kWc</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Production/an</span>
              <span className="font-semibold text-indigo-600">
                {Math.round(night.installation.estimatedAnnualProductionKwh).toLocaleString()} kWh
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Coût</span>
              <span className="font-semibold text-gray-900">
                {Math.round(night.installation.estimatedCost).toLocaleString()} TND
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Autoconsommation</span>
              <span className="font-bold text-indigo-600">
                {Math.round((night.installation.selfConsumptionRate || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Stockage</span>
              <span className="font-bold text-indigo-600">
                {night.installation.storageCapacityKwh} kWh
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Metrics Deltas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <Battery className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">Autoconsommation</p>
          <p className="text-lg font-bold text-indigo-600">
            +{Math.round(data.selfConsumptionGainPercent)}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">Couverture nuit</p>
          <p className="text-lg font-bold text-amber-600">
            {Math.round((night.installation.nightCoverageRate || 0) * 100)}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <Leaf className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">CO₂ économisé</p>
          <p className="text-lg font-bold text-green-600">
            {Math.round(night.installation.co2Savings).toLocaleString()} kg
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">Économie/mois (NP)</p>
          <p className="text-lg font-bold text-green-600">
            {Math.round(night.installation.monthlySavings).toLocaleString()} TND
          </p>
        </div>
      </div>

      {/* ── Charts Section ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setChartTab("curve")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartTab === "curve"
                ? "bg-indigo-100 text-indigo-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            📊 Courbe 24h Production/Consommation
          </button>
          <button
            onClick={() => setChartTab("financial")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartTab === "financial"
                ? "bg-green-100 text-green-700"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            💰 Comparaison financière
          </button>
        </div>

        {/* 24h Curve Chart */}
        {chartTab === "curve" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Production solaire vs Consommation sur 24h
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Voyez comment les Night Panels couvrent la consommation nocturne grâce au stockage intégré
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyCurveData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradProdClassic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProdNight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradStorage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" stroke="#6B7280" style={{ fontSize: "11px" }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: "11px" }} unit=" kWh" />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }}
                    formatter={(value: any, name: string) => [`${value} kWh`, name]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="consommation" name="Consommation" stroke="#F59E0B" strokeWidth={2} fill="url(#gradCons)" />
                  <Area type="monotone" dataKey="productionClassique" name="☀️ Classique" stroke="#4CAF50" strokeWidth={2} fill="url(#gradProdClassic)" />
                  <Area type="monotone" dataKey="déstocké" name="🌙 Déstocké (Night)" stroke="#8B5CF6" strokeWidth={2} fill="url(#gradStorage)" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legend info */}
            <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span> Consommation du ménage
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500"></span> Production classique
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span> Énergie déstockée (nuit)
              </span>
            </div>
          </div>
        )}

        {/* Financial Comparison */}
        {chartTab === "financial" && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Comparaison financière détaillée
            </h3>
            <div className="space-y-3">
              {financialCompare.map((item, idx) => {
                const diff = item.night - item.classic;
                const nightBetter = item.lowerBetter ? diff < 0 : diff > 0;
                return (
                  <div key={idx} className="grid grid-cols-4 gap-4 items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">
                        {typeof item.classic === "number" ? item.classic.toLocaleString() : item.classic} {item.unit}
                      </p>
                      <p className="text-xs text-gray-400">Classique</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${nightBetter ? "text-indigo-600" : "text-gray-900"}`}>
                        {typeof item.night === "number" ? item.night.toLocaleString() : item.night} {item.unit}
                      </p>
                      <p className="text-xs text-gray-400">Night Panel</p>
                    </div>
                    <div className="text-center">
                      <DeltaBadge
                        value={Math.round(diff * 10) / 10}
                        unit={item.unit}
                        inverse={item.lowerBetter}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cash flow chart */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Flux de trésorerie cumulé sur 25 ans</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={classic.financials.cumulativeCashFlow.map((v, i) => ({
                      year: i,
                      classic: v,
                      nightPanel: night.financials.cumulativeCashFlow[i] || 0,
                    }))}
                  >
                    <defs>
                      <linearGradient id="gradCashClassic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCashNight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="year" stroke="#6B7280" label={{ value: "Années", position: "insideBottom", offset: -5 }} />
                    <YAxis stroke="#6B7280" unit=" TND" />
                    <Tooltip formatter={(v: any) => [`${Math.round(v).toLocaleString()} TND`]} labelFormatter={(l) => `Année ${l}`} />
                    <Legend />
                    <Area type="monotone" dataKey="classic" name="☀️ Classique" stroke="#4CAF50" strokeWidth={2} fill="url(#gradCashClassic)" />
                    <Area type="monotone" dataKey="nightPanel" name="🌙 Night Panel" stroke="#6366F1" strokeWidth={2} fill="url(#gradCashNight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
