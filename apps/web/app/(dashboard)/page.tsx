"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { SpendChart } from "@/components/charts/spend-chart";
import {
  getUsageSummary,
  getSpendTimeseries,
  getModelBreakdown,
  getAlerts,
  type UsageSummary,
  type SpendDataPoint,
  type ModelBreakdown,
  type Alert,
} from "@/lib/api-client";
import { formatCurrency, formatCompact, formatPercent, formatDateTime } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export default function OverviewPage() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [spendData, setSpendData] = useState<SpendDataPoint[]>([]);
  const [models, setModels] = useState<ModelBreakdown[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [timeRange, setTimeRange] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [s, sd, m, a] = await Promise.all([
        getUsageSummary(),
        getSpendTimeseries(timeRange),
        getModelBreakdown(),
        getAlerts(),
      ]);
      setSummary(s);
      setSpendData(sd);
      setModels(m);
      setAlerts(a);
      setLoading(false);
    }
    load();
  }, [timeRange]);

  if (loading || !summary) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-5 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
              <div className="h-7 bg-gray-100 rounded w-28" />
            </div>
          ))}
        </div>
        <div className="border border-gray-200 rounded-lg p-5 h-[360px] animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
          <div className="h-full bg-gray-50 rounded" />
        </div>
      </div>
    );
  }

  const unresolvedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Spend"
          value={formatCurrency(summary.totalSpendUsd)}
          change={formatPercent(summary.spendChangePercent)}
          changeType={summary.spendChangePercent > 0 ? "negative" : "positive"}
        />
        <StatCard
          label="Requests"
          value={formatCompact(summary.totalRequests)}
          change={formatPercent(summary.requestsChangePercent)}
          changeType={summary.requestsChangePercent > 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Tokens"
          value={formatCompact(summary.totalTokens)}
          change={formatPercent(summary.tokensChangePercent)}
          changeType={summary.tokensChangePercent < 0 ? "positive" : "neutral"}
        />
        <StatCard
          label="Avg. Cost / Request"
          value={`$${summary.avgCostPerRequestUsd.toFixed(3)}`}
        />
      </div>

      {/* Unresolved alerts banner */}
      {unresolvedAlerts.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 mb-6 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {unresolvedAlerts.length} unresolved alert{unresolvedAlerts.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {unresolvedAlerts[0].message}
            </p>
          </div>
        </div>
      )}

      {/* Spend Over Time */}
      <div className="border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-900">Spend Over Time</h2>
          <div className="flex gap-1">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setTimeRange(d)}
                className={`text-xs px-2.5 py-1 rounded transition-colors ${
                  timeRange === d
                    ? "bg-zinc-900 text-white font-medium"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <SpendChart data={spendData} />
      </div>

      {/* Model Breakdown */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Cost by Model</h2>
        <div className="space-y-3">
          {models.map((m) => (
            <div key={m.model} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900 truncate">{m.model}</span>
                  <span className="text-sm font-mono text-gray-600 ml-2">
                    {formatCurrency(m.costUsd)}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-800 rounded-full"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-10 text-right">
                {m.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
