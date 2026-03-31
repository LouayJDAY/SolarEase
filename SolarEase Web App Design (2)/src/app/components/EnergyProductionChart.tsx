import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Données mockées sur 12 mois
const data = [
  { month: "Jan", production: 4200, consommation: 3800, revenue: 18500 },
  { month: "Fév", production: 4500, consommation: 4000, revenue: 19200 },
  { month: "Mar", production: 5200, consommation: 4300, revenue: 21500 },
  { month: "Avr", production: 5800, consommation: 4500, revenue: 23800 },
  { month: "Mai", production: 6500, consommation: 4800, revenue: 26200 },
  { month: "Juin", production: 7200, consommation: 5200, revenue: 28900 },
  { month: "Juil", production: 7800, consommation: 5600, revenue: 31200 },
  { month: "Août", production: 7500, consommation: 5400, revenue: 30100 },
  { month: "Sept", production: 6800, consommation: 5000, revenue: 27500 },
  { month: "Oct", production: 5900, consommation: 4600, revenue: 24200 },
  { month: "Nov", production: 4800, consommation: 4200, revenue: 20800 },
  { month: "Déc", production: 4300, consommation: 4000, revenue: 19500 },
];

interface EnergyProductionChartProps {
  mode?: "energy" | "revenue";
}

export function EnergyProductionChart({
  mode = "energy",
}: EnergyProductionChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-secondary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}:{" "}
              <span className="font-semibold">
                {mode === "energy"
                  ? `${entry.value.toLocaleString()} kWh`
                  : `${entry.value.toLocaleString()} TND`}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-secondary">
            {mode === "energy"
              ? "Production vs. Consommation d'Énergie"
              : "Évolution du Chiffre d'Affaires"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "energy"
              ? "Évolution sur les 12 derniers mois (kWh)"
              : "Évolution sur les 12 derniers mois (TND)"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {mode === "energy" && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Production
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span className="text-sm text-muted-foreground">
                  Consommation
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2ECC71" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient
                id="colorConsommation"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#FFB84D" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FFB84D" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2ECC71" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            {mode === "energy" ? (
              <>
                <Area
                  type="monotone"
                  dataKey="production"
                  name="Production"
                  stroke="#2ECC71"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProduction)"
                />
                <Area
                  type="monotone"
                  dataKey="consommation"
                  name="Consommation"
                  stroke="#FFB84D"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorConsommation)"
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="revenue"
                name="Chiffre d'Affaires"
                stroke="#2ECC71"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer */}
      {mode === "energy" && (
        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Production Totale</p>
            <p className="text-lg font-semibold text-primary mt-1">
              72,600 kWh
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Consommation Totale
            </p>
            <p className="text-lg font-semibold text-accent mt-1">
              55,200 kWh
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Surplus</p>
            <p className="text-lg font-semibold text-primary mt-1">
              17,400 kWh
            </p>
          </div>
        </div>
      )}

      {mode === "revenue" && (
        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">CA Total</p>
            <p className="text-lg font-semibold text-primary mt-1">
              291,400 TND
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Moyenne Mensuelle</p>
            <p className="text-lg font-semibold text-secondary mt-1">
              24,283 TND
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Croissance Annuelle
            </p>
            <p className="text-lg font-semibold text-primary mt-1">+18%</p>
          </div>
        </div>
      )}
    </div>
  );
}
