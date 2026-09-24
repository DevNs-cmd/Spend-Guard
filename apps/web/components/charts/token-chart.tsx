"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TokenDataPoint {
  date: string;
  input: number;
  output: number;
}

interface TokenChartProps {
  data: TokenDataPoint[];
}

export function TokenChart({ data }: TokenChartProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={{ stroke: "#e4e4e7" }}
            minTickGap={40}
            interval="preserveStartEnd"
            tickFormatter={(val: string) => {
              const d = new Date(val);
              return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
              return val.toString();
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: "6px",
              fontSize: "13px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name === "input" ? "Input Tokens" : "Output Tokens",
            ]}
          />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: "12px", color: "#71717a" }}
          />
          <Bar dataKey="input" name="Input" fill="#0f172a" radius={[2, 2, 0, 0]} />
          <Bar dataKey="output" name="Output" fill="#94a3b8" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
