"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getUsageRecords,
  type UsageRecord,
} from "@/lib/api-client";
import { TokenChart } from "@/components/charts/token-chart";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Download, Search, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Upload } from "lucide-react";
import { ImportDataModal } from "@/components/dashboard/import-data-modal";

type SortKey = "timestamp" | "provider" | "model" | "costUsd";
type SortDir = "asc" | "desc";

export default function UsagePage() {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [timeRange, setTimeRange] = useState(30);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const PAGE_SIZE = 25;

  const loadData = useCallback(() => {
    setLoading(true);
    getUsageRecords().then((data) => {
      setRecords(data);
      setLoading(false);
      setLastUpdated(new Date());
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const providers = [...new Set(records.map((r) => r.provider))];
  const projects = [...new Set(records.map((r) => r.project))];

  // Date range filter
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - timeRange);

  const filtered = records.filter((r) => {
    const ts = new Date(r.timestamp);
    if (ts < cutoff) return false;
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

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "timestamp":
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        break;
      case "provider":
        cmp = a.provider.localeCompare(b.provider);
        break;
      case "model":
        cmp = a.model.localeCompare(b.model);
        break;
      case "costUsd":
        cmp = a.costUsd - b.costUsd;
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, providerFilter, projectFilter, timeRange]);

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "timestamp" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-gray-700" /> : <ArrowDown size={12} className="text-gray-700" />;
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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Usage & Costs</h1>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md px-3 py-1.5 transition-colors shadow-sm"
          >
            <Upload size={13} />
            Enter / Import Spend
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
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
        {/* Date range filter */}
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setTimeRange(d)}
              className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
                timeRange === d
                  ? "bg-zinc-900 text-white font-medium"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-gray-300"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Records table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th
                  className="text-left px-4 py-2.5 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("timestamp")}
                >
                  <span className="flex items-center gap-1">Time <SortIcon col="timestamp" /></span>
                </th>
                <th
                  className="text-left px-4 py-2.5 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("provider")}
                >
                  <span className="flex items-center gap-1">Provider <SortIcon col="provider" /></span>
                </th>
                <th
                  className="text-left px-4 py-2.5 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("model")}
                >
                  <span className="flex items-center gap-1">Model <SortIcon col="model" /></span>
                </th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Input</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-600">Output</th>
                <th
                  className="text-right px-4 py-2.5 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => handleSort("costUsd")}
                >
                  <span className="flex items-center justify-end gap-1">Cost <SortIcon col="costUsd" /></span>
                </th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Project</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">User</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No records match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
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
        {/* Pagination */}
        {sorted.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} records
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 text-gray-500 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-600 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 text-gray-500 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ImportDataModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
