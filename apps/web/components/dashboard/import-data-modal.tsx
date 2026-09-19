"use client";

import { useState } from "react";
import { X, Upload, DollarSign, Check, FileText, Sparkles, Database } from "lucide-react";
import { getCurrentOrgId } from "@/lib/auth";
import { importHistoricalData } from "@/lib/tenant-store";
import { useToast } from "@/components/ui/toast";

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PROVIDER_OPTIONS = [
  { key: "openai", label: "OpenAI", defaultModel: "GPT-4o" },
  { key: "anthropic", label: "Anthropic", defaultModel: "Claude 3.5 Sonnet" },
  { key: "gemini", label: "Google Gemini", defaultModel: "Gemini 1.5 Pro" },
  { key: "mistral", label: "Mistral AI", defaultModel: "Mistral Large" },
  { key: "azure", label: "Azure OpenAI", defaultModel: "GPT-4o (Azure)" },
  { key: "bedrock", label: "AWS Bedrock", defaultModel: "Claude 3.5 (Bedrock)" },
];

export function ImportDataModal({ isOpen, onClose, onSuccess }: ImportDataModalProps) {
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("GPT-4o");
  const [totalSpend, setTotalSpend] = useState("");
  const [requests, setRequests] = useState("");
  const [tokens, setTokens] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsedRecords, setParsedRecords] = useState<any[]>([]);
  const [parsedModels, setParsedModels] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const found = PROVIDER_OPTIONS.find((p) => p.key === newProvider);
    if (found) {
      setModel(found.defaultModel);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const spendNum = parseFloat(totalSpend);
    if (isNaN(spendNum) || spendNum < 0) {
      toast("Please enter a valid spend amount.", "error");
      return;
    }

    setSubmitting(true);
    const orgId = getCurrentOrgId();

    importHistoricalData(orgId, {
      provider: provider as any,
      model: model.trim() || "GPT-4o",
      totalSpendUsd: spendNum,
      requests: requests ? parseInt(requests, 10) : undefined,
      tokens: tokens ? parseInt(tokens, 10) : undefined,
      budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
    });

    toast(`Successfully imported $${spendNum.toFixed(2)} in existing spend!`);
    setSubmitting(false);
    onClose();
    if (onSuccess) onSuccess();
    else window.location.reload();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);

      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const headerCols = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
        
        // Find column indices
        const dateIdx = headerCols.findIndex((h) => h.includes("date") || h.includes("time"));
        const provIdx = headerCols.findIndex((h) => h.includes("provider"));
        const modelIdx = headerCols.findIndex((h) => h.includes("model"));
        const costIdx = headerCols.findIndex((h) => h.includes("cost") || h.includes("amount") || h.includes("usd") || h.includes("price"));
        const inputTokIdx = headerCols.findIndex((h) => h.includes("input"));
        const outputTokIdx = headerCols.findIndex((h) => h.includes("output"));
        const tokensIdx = headerCols.findIndex((h) => h.includes("token") && !h.includes("input") && !h.includes("output"));
        const projIdx = headerCols.findIndex((h) => h.includes("project"));
        const userIdx = headerCols.findIndex((h) => h.includes("user") || h.includes("email"));

        let total = 0;
        let totalToks = 0;
        const records: any[] = [];
        const modelMap = new Map<string, { cost: number; requests: number; tokens: number; provider: string }>();

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim().replace(/["']/g, ""));
          if (cols.length < 2) continue;

          const rowCost = costIdx !== -1 ? parseFloat(cols[costIdx].replace(/[$]/g, "")) : parseFloat(cols[3] || "0");
          if (isNaN(rowCost) || rowCost < 0) continue;

          const rowModel = (modelIdx !== -1 ? cols[modelIdx] : cols[2]) || "GPT-4o";
          let rowProv = (provIdx !== -1 ? cols[provIdx]?.toLowerCase() : "openai") || "openai";
          if (rowModel.toLowerCase().includes("claude")) rowProv = "anthropic";
          else if (rowModel.toLowerCase().includes("gemini")) rowProv = "gemini";
          else if (rowModel.toLowerCase().includes("mistral")) rowProv = "mistral";

          const inpTokens = inputTokIdx !== -1 ? parseInt(cols[inputTokIdx], 10) || 500 : 800;
          const outTokens = outputTokIdx !== -1 ? parseInt(cols[outputTokIdx], 10) || 200 : 300;
          const lineTokens = tokensIdx !== -1 ? parseInt(cols[tokensIdx], 10) || (inpTokens + outTokens) : (inpTokens + outTokens);

          total += rowCost;
          totalToks += lineTokens;

          // Model aggregation
          const existing = modelMap.get(rowModel) || { cost: 0, requests: 0, tokens: 0, provider: rowProv };
          existing.cost += rowCost;
          existing.requests += 1;
          existing.tokens += lineTokens;
          modelMap.set(rowModel, existing);

          records.push({
            id: `ur-csv-${i}`,
            timestamp: (dateIdx !== -1 && cols[dateIdx]) ? new Date(cols[dateIdx]).toISOString() : new Date().toISOString(),
            provider: rowProv,
            model: rowModel,
            inputTokens: inpTokens,
            outputTokens: outTokens,
            costUsd: rowCost,
            project: (projIdx !== -1 && cols[projIdx]) ? cols[projIdx] : "Production API",
            user: (userIdx !== -1 && cols[userIdx]) ? cols[userIdx] : "demo@company.com",
            tags: ["imported", "billing"],
          });
        }

        if (total > 0) {
          const calculatedModels = Array.from(modelMap.entries()).map(([mName, mData]) => ({
            model: mName,
            provider: mData.provider,
            costUsd: parseFloat(mData.cost.toFixed(2)),
            requests: mData.requests,
            tokens: mData.tokens,
            percentage: parseFloat(((mData.cost / total) * 100).toFixed(1)),
          }));

          setTotalSpend(total.toFixed(2));
          setRequests(String(records.length));
          setTokens(String(totalToks));
          setParsedRecords(records);
          setParsedModels(calculatedModels);
          toast(`Loaded ${records.length} billing records ($${total.toFixed(2)} total)`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleCsvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const spendNum = parseFloat(totalSpend);
    if (isNaN(spendNum) || spendNum <= 0) {
      toast("Please enter or upload valid CSV billing rows.", "error");
      return;
    }

    setSubmitting(true);
    const orgId = getCurrentOrgId();

    importHistoricalData(orgId, {
      provider: provider as any,
      model: model.trim() || "GPT-4o",
      totalSpendUsd: spendNum,
      requests: requests ? parseInt(requests, 10) : undefined,
      tokens: tokens ? parseInt(tokens, 10) : undefined,
      budgetLimit: budgetLimit ? parseFloat(budgetLimit) : undefined,
      customRecords: parsedRecords.length > 0 ? parsedRecords : undefined,
      customModels: parsedModels.length > 0 ? parsedModels : undefined,
    });

    toast(`Successfully imported $${spendNum.toFixed(2)} historical spend!`);
    setSubmitting(false);
    onClose();
    if (onSuccess) onSuccess();
    else window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-white">
              <Database size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Enter Existing Spend Till Date</h2>
              <p className="text-xs text-gray-500">Seed your dashboard with your real historical AI costs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 px-6 pt-2 bg-gray-50/30">
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              tab === "manual"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Manual Entry (Quick)
          </button>
          <button
            type="button"
            onClick={() => setTab("csv")}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              tab === "csv"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Upload Billing CSV
          </button>
        </div>

        {/* Tab 1: Manual Entry Form */}
        {tab === "manual" ? (
          <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
            {/* Provider and Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  AI Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Primary Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. GPT-4o"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
            </div>

            {/* Total Spend Till Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Spend Till Date (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <DollarSign size={16} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalSpend}
                  onChange={(e) => setTotalSpend(e.target.value)}
                  placeholder="e.g. 248.50"
                  required
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Enter what you have spent so far this month or year-to-date.
              </p>
            </div>

            {/* Optional Requests & Tokens */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Requests (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={requests}
                  onChange={(e) => setRequests(e.target.value)}
                  placeholder="e.g. 1850"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Monthly Budget Limit (optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                    <DollarSign size={14} />
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={budgetLimit}
                    onChange={(e) => setBudgetLimit(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !totalSpend}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
              >
                {submitting ? "Applying Data…" : "Apply & Update Dashboard"}
              </button>
            </div>
          </form>
        ) : (
          /* Tab 2: CSV Upload Form */
          <form onSubmit={handleCsvSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Upload Provider Billing Export (CSV)
              </label>
              <div className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-xl p-6 text-center bg-gray-50/50 transition-colors">
                <FileText size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-medium text-gray-700 mb-1">
                  {fileName ? fileName : "Drag and drop or click to upload CSV"}
                </p>
                <p className="text-[11px] text-gray-400 mb-3">
                  Compatible with OpenAI Usage Export, Anthropic Invoices, or simple CSV
                </p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm">
                  <Upload size={13} />
                  Choose CSV File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {totalSpend && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                <span>Calculated Spend from CSV:</span>
                <span className="font-bold text-sm text-emerald-700">${totalSpend}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !totalSpend}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
              >
                {submitting ? "Importing…" : "Import CSV Data"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
