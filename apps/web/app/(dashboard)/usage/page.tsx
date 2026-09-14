"use client";

import { useEffect, useState } from "react";
import {
  getUsageRecords,
  getModelBreakdown,
  type UsageRecord,
  type ModelBreakdown,
} from "@/lib/api-client";
import { TokenChart } from "@/components/charts/token-chart";
import { formatCurrency, formatCompact, formatDateTime } from "@/lib/utils";
import { Download, Search } from "lucide-react";

export default function UsagePage() {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  useEffect(() => {
    getUsageRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const providers = [...new Set(records.map((r) => r.provider))];
  const projects = [...new Set(records.map((r) => r.project))];

  const filtered = records.filter((r) => {
    if (providerFilter !== "all" && r.provider !== providerFilter) return false;
    if (projectFilter !== "all" && r.project !== projectFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.model.toLowerCase().includes(q) ||
        r.user.toLowerCase().includes(q) ||
        r.project.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Build token chart data grouped by date
  const tokenByDate = new Map<string, { input: number; output: number }>();
  filtered.forEach((r) => {
    const date = r.timestamp.split("T")[0];
    const existing = tokenByDate.get(date) || { input: 0, output: 0 };
    existing.input += r.inputTokens;
    existing.output += r.outputTokens;
    tokenByDate.set(date, existing);
  });
  const tokenChartData = Array.from(tokenByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const handleExport = () => {
    const headers = ["Timestamp", "Provider", "Model", "Input Tokens", "Output Tokens", "Cost (USD)", "Project", "User", "Tags"];
    const rows = filtered.map((r) => [
      r.timestamp, r.provider, r.model, r.inputTokens, r.outputTokens,
      r.costUsd, r.project, r.user, r.tags.join("; "),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spendguard-usage-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Usage & Costs</h1>
        <div className="border border-gray-200 rounded-lg p-5 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Usage & Costs</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Token chart */}
      {tokenChartData.length > 1 && (
        <div className="border border-gray-200 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Token Consumption</h2>
          <TokenChart data={tokenChartData} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search model, user, project…"
            className="border border-gray-300 rounded pl-8 pr-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="all">All providers</option>
          {providers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="all">All projects</option>
          {projects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Records table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Time</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Provider</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Model</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Input</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Output</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Cost</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Project</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">User</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No records match your filters.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 30).map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                      {formatDateTime(r.timestamp)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900">{r.provider}</td>
                    <td className="px-4 py-2.5 text-gray-900">{r.model}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600 tabular-nums">
                      {r.inputTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 tabular-nums">
                      {r.outputTokens.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900 tabular-nums">
                      {formatCurrency(r.costUsd)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{r.project}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{r.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 30 && (
          <div className="px-4 py-2.5 border-t border-gray-200 text-xs text-gray-500">
            Showing 30 of {filtered.length} records
          </div>
        )}
      </div>
    </div>
  );
}
