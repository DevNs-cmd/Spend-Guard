"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SpendDataPoint } from "@/lib/api-client";

interface SpendChartProps {
  data: SpendDataPoint[];
}

export function SpendChart({ data }: SpendChartProps) {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
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
            tickFormatter={(val: number) => `$${val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: "6px",
              fontSize: "13px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Spend"]}
            labelFormatter={(label: string) => {
              const d = new Date(label);
              return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#0f172a"
            strokeWidth={1.5}
            fill="#f1f5f9"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
