import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type EnergyChartPoint = {
  month: string;
  production: number;
  consommation?: number;
  revenue?: number;
};

interface EnergyProductionChartProps {
  mode?: "energy" | "revenue";
  data?: EnergyChartPoint[];
}

export function EnergyProductionChart({
  mode = "energy",
  data = [],
}: EnergyProductionChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-secondary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
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

  const totalProduction = data.reduce((sum, row) => sum + (row.production ?? 0), 0);
  const totalConsumption = data.reduce((sum, row) => sum + (row.consommation ?? 0), 0);
  const totalRevenue = data.reduce((sum, row) => sum + (row.revenue ?? 0), 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
        Aucune donnée de production disponible pour ce projet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-secondary">
            {mode === "energy"
              ? "Production vs. Consommation d'Énergie"
              : "Évolution du Chiffre d'Affaires"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "energy"
              ? "Évolution mensuelle (kWh)"
              : "Évolution mensuelle (TND)"}
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2ECC71" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorConsommation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFB84D" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FFB84D" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2ECC71" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: "12px" }} />
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
                {data.some((row) => row.consommation != null) && (
                  <Area
                    type="monotone"
                    dataKey="consommation"
                    name="Consommation"
                    stroke="#FFB84D"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorConsommation)"
                  />
                )}
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

      {mode === "energy" && (
        <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Production Totale</p>
            <p className="text-lg font-semibold text-primary mt-1">
              {totalProduction.toLocaleString("fr-TN")} kWh
            </p>
          </div>
          {totalConsumption > 0 && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Consommation Totale</p>
                <p className="text-lg font-semibold text-accent mt-1">
                  {totalConsumption.toLocaleString("fr-TN")} kWh
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Surplus</p>
                <p className="text-lg font-semibold text-primary mt-1">
                  {(totalProduction - totalConsumption).toLocaleString("fr-TN")} kWh
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {mode === "revenue" && totalRevenue > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-muted-foreground">CA Total</p>
            <p className="text-lg font-semibold text-primary mt-1">
              {totalRevenue.toLocaleString("fr-TN")} TND
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
