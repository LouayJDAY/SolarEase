import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ProductionChartProps {
  data: Array<{
    month: string;
    production: number;
    target?: number;
  }>;
  type?: "line" | "bar";
}

export function ProductionChart({ data, type = "bar" }: ProductionChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-secondary mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value} kWh</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      {type === "line" ? (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
          <Line
            type="monotone"
            dataKey="production"
            stroke="#2ECC71"
            strokeWidth={2}
            name="Production"
            dot={{ fill: "#2ECC71", r: 4 }}
            activeDot={{ r: 6 }}
          />
          {data[0]?.target && (
            <Line
              type="monotone"
              dataKey="target"
              stroke="#F39C12"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Objectif"
              dot={false}
            />
          )}
        </LineChart>
      ) : (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
          <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
          <Bar dataKey="production" fill="#2ECC71" name="Production" radius={[8, 8, 0, 0]} />
          {data[0]?.target && (
            <Bar
              dataKey="target"
              fill="#F39C12"
              name="Objectif"
              radius={[8, 8, 0, 0]}
              opacity={0.6}
            />
          )}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
