"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTrends,
  getAnomalies,
  getModelBreakdown,
  type TrendDataPoint,
  type Anomaly,
  type ModelBreakdown,
} from "@/lib/api-client";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortKey = "model" | "costUsd" | "requests" | "costPerReq" | "costPerKTokens";
type SortDir = "asc" | "desc";

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [models, setModels] = useState<ModelBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("costUsd");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([getTrends(), getAnomalies(), getModelBreakdown()]).then(
      ([t, a, m]) => {
        setTrends(t);
        setAnomalies(a);
        setModels(m);
        setLoading(false);
        setLastUpdated(new Date());
      }
    );
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-gray-700" /> : <ArrowDown size={12} className="text-gray-700" />;
  };

  const sortedModels = [...models].sort((a, b) => {
    let cmp = 0;
    const aCostPerReq = a.costUsd / a.requests;
    const bCostPerReq = b.costUsd / b.requests;
    const aCostPerK = (a.costUsd / a.tokens) * 1000;
    const bCostPerK = (b.costUsd / b.tokens) * 1000;
    switch (sortKey) {
      case "model": cmp = a.model.localeCompare(b.model); break;
      case "costUsd": cmp = a.costUsd - b.costUsd; break;
      case "requests": cmp = a.requests - b.requests; break;
      case "costPerReq": cmp = aCostPerReq - bCostPerReq; break;
      case "costPerKTokens": cmp = aCostPerK - bCostPerK; break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Analytics</h1>
        <div className="border border-gray-200 rounded-lg p-5 h-[360px] animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-40" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        {lastUpdated && (
          <button
            onClick={loadData}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </button>
        )}
      </div>

      {/* Trend & Forecast chart */}
      <div className="border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">
          Spend Trend & Forecast
        </h2>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trends}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e4e4e7"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#71717a" }}
                tickLine={false}
                axisLine={{ stroke: "#e4e4e7" }}
                minTickGap={45}
                interval="preserveStartEnd"
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#71717a" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e4e4e7",
                  borderRadius: "6px",
                  fontSize: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
                formatter={(value: number, name: string) => [
                  `$${value.toFixed(2)}`,
                  name === "actual" ? "Actual" : "Forecast",
                ]}
                labelFormatter={(label: string) => {
                  const d = new Date(label);
                  return d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#0f172a"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-zinc-900 rounded" />
            Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-zinc-400 rounded" style={{ borderTop: "1px dashed #94a3b8" }} />
            Forecast
          </span>
        </div>
      </div>

      {/* Anomalies */}
      <div className="border border-gray-200 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">
          Anomalies Detected
        </h2>
        {anomalies.length === 0 ? (
          <p className="text-sm text-gray-500">No anomalies detected recently.</p>
        ) : (
          <div className="space-y-3">
            {anomalies.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 border border-gray-100 rounded-lg px-4 py-3"
              >
                <AlertTriangle
                  size={16}
                  className={`mt-0.5 flex-shrink-0 ${
                    a.severity === "high"
                      ? "text-red-500"
                      : a.severity === "medium"
                      ? "text-amber-500"
                      : "text-gray-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{a.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{a.model}</span>
                    <span>
                      Expected: {formatCurrency(a.expectedCostUsd)} → Actual:{" "}
                      {formatCurrency(a.actualCostUsd)}
                    </span>
                    <span>{formatDateTime(a.timestamp)}</span>
                  </div>
                </div>
                <span
                  className={`text-xs rounded px-1.5 py-0.5 capitalize flex-shrink-0 ${
                    a.severity === "high"
                      ? "bg-red-100 text-red-700"
                      : a.severity === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model Efficiency Comparison */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-4">
          Cost Efficiency by Model
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th
                  className="text-left py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("model")}
                >
                  <span className="flex items-center gap-1">Model <SortIcon col="model" /></span>
                </th>
                <th className="text-left py-2 font-medium text-gray-600">Provider</th>
                <th
                  className="text-right py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("costUsd")}
                >
                  <span className="flex items-center justify-end gap-1">Total Cost <SortIcon col="costUsd" /></span>
                </th>
                <th
                  className="text-right py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("requests")}
                >
                  <span className="flex items-center justify-end gap-1">Requests <SortIcon col="requests" /></span>
                </th>
                <th
                  className="text-right py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("costPerReq")}
                >
                  <span className="flex items-center justify-end gap-1">Cost/Request <SortIcon col="costPerReq" /></span>
                </th>
                <th
                  className="text-right py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("costPerKTokens")}
                >
                  <span className="flex items-center justify-end gap-1">Cost/1K Tokens <SortIcon col="costPerKTokens" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map((m) => {
                const costPerReq = m.costUsd / m.requests;
                const costPerKTokens = (m.costUsd / m.tokens) * 1000;
                return (
                  <tr key={m.model} className="border-b border-gray-100">
                    <td className="py-2.5 text-gray-900">{m.model}</td>
                    <td className="py-2.5 text-gray-500">{m.provider}</td>
                    <td className="py-2.5 text-right text-gray-900 tabular-nums">
                      {formatCurrency(m.costUsd)}
                    </td>
                    <td className="py-2.5 text-right text-gray-600 tabular-nums">
                      {m.requests.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-gray-600 tabular-nums">
                      ${costPerReq.toFixed(4)}
                    </td>
                    <td className="py-2.5 text-right text-gray-600 tabular-nums">
                      ${costPerKTokens.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
