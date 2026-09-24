"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  Database,
  ArrowRight,
  Download,
  AlertCircle,
  FileText,
} from "lucide-react";
import { getCurrentOrgId } from "@/lib/auth";
import { importHistoricalData } from "@/lib/tenant-store";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatCompact } from "@/lib/utils";

const PROVIDER_OPTIONS = [
  { key: "openai", label: "OpenAI", defaultModel: "GPT-4o" },
  { key: "anthropic", label: "Anthropic", defaultModel: "Claude 3.5 Sonnet" },
  { key: "gemini", label: "Google Gemini", defaultModel: "Gemini 1.5 Pro" },
  { key: "mistral", label: "Mistral AI", defaultModel: "Mistral Large" },
  { key: "azure", label: "Azure OpenAI", defaultModel: "GPT-4o (Azure)" },
  { key: "bedrock", label: "AWS Bedrock", defaultModel: "Claude 3.5 (Bedrock)" },
];

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<"csv" | "manual">("csv");
  
  // CSV State
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsedModels, setParsedModels] = useState<any[]>([]);
  const [totalSpend, setTotalSpend] = useState<number>(0);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  
  // Manual State
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("GPT-4o");
  const [manualSpend, setManualSpend] = useState("");
  const [manualRequests, setManualRequests] = useState("");
  const [manualTokens, setManualTokens] = useState("");
  const [manualBudget, setManualBudget] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleProviderChange = (newP: string) => {
    setProvider(newP);
    const found = PROVIDER_OPTIONS.find((p) => p.key === newP);
    if (found) setModel(found.defaultModel);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSuccess(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const headerCols = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
        
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

          setTotalSpend(parseFloat(total.toFixed(2)));
          setTotalTokens(totalToks);
          setParsedRows(records);
          setParsedModels(calculatedModels);
          toast(`Parsed ${records.length} records totaling $${total.toFixed(2)}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleApplyCsv = () => {
    if (parsedRows.length === 0 || totalSpend <= 0) {
      toast("Please select a valid CSV file with billing data first.", "error");
      return;
    }

    setLoading(true);
    const orgId = getCurrentOrgId();

    importHistoricalData(orgId, {
      provider: "openai",
      model: parsedModels[0]?.model || "GPT-4o",
      totalSpendUsd: totalSpend,
      requests: parsedRows.length,
      tokens: totalTokens,
      customRecords: parsedRows,
      customModels: parsedModels,
    });

    setLoading(false);
    setSuccess(true);
    toast(`Successfully imported $${totalSpend.toFixed(2)} into your dashboard!`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const spendNum = parseFloat(manualSpend);
    if (isNaN(spendNum) || spendNum < 0) {
      toast("Please enter a valid spend amount.", "error");
      return;
    }

    setLoading(true);
    const orgId = getCurrentOrgId();

    importHistoricalData(orgId, {
      provider: provider as any,
      model: model.trim() || "GPT-4o",
      totalSpendUsd: spendNum,
      requests: manualRequests ? parseInt(manualRequests, 10) : undefined,
      tokens: manualTokens ? parseInt(manualTokens, 10) : undefined,
      budgetLimit: manualBudget ? parseFloat(manualBudget) : undefined,
    });

    setLoading(false);
    setSuccess(true);
    toast(`Imported $${spendNum.toFixed(2)} into your dashboard!`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Import AI Billing & Usage Data</h1>
          <p className="text-xs text-gray-500 mt-1">
            Seed your workspace with historical spending, token usage, and model logs till date.
          </p>
        </div>

        <a
          href="/demo_ai_billing_data.csv"
          download="demo_ai_billing_data.csv"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 font-medium transition-colors shadow-sm self-start"
        >
          <Download size={14} className="text-zinc-500" />
          <span>Download Sample Demo CSV</span>
        </a>
      </div>

      {/* Success Notification Banner */}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Data Imported Successfully!</p>
              <p className="text-xs text-emerald-700">Your dashboard, charts, and usage tables are now live with this data.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <span>View Dashboard</span>
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/usage"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <span>View Usage Table</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setActiveTab("csv"); setSuccess(false); }}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "csv"
              ? "border-zinc-900 text-zinc-900 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileSpreadsheet size={16} />
          <span>Upload Provider Billing CSV</span>
        </button>
        <button
          onClick={() => { setActiveTab("manual"); setSuccess(false); }}
          className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "manual"
              ? "border-zinc-900 text-zinc-900 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Database size={16} />
          <span>Manual Entry (Spend Till Date)</span>
        </button>
      </div>

      {/* Tab 1: CSV Upload */}
      {activeTab === "csv" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="border-2 border-dashed border-gray-300 hover:border-zinc-500 rounded-xl p-8 text-center bg-gray-50/60 transition-colors">
              <FileSpreadsheet size={36} className="mx-auto text-zinc-400 mb-2" />
              <p className="text-sm font-semibold text-gray-800 mb-1">
                {fileName ? fileName : "Upload your AI Provider Billing CSV"}
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
                Compatible with OpenAI Usage Exports, Anthropic Invoices, AWS Bedrock CSVs, or the provided sample demo file.
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
                <Upload size={14} />
                <span>Select CSV File</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Parsed Summary Card */}
            {parsedRows.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                    <p className="text-xs text-gray-500">Total Spend in CSV</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalSpend)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                    <p className="text-xs text-gray-500">Records Found</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{parsedRows.length} calls</p>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                    <p className="text-xs text-gray-500">Total Tokens</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{formatCompact(totalTokens)}</p>
                  </div>
                </div>

                {/* Model breakdown preview */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Detected Model Distribution:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedModels.map((m) => (
                      <div key={m.model} className="flex items-center gap-2 bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs">
                        <span className="font-semibold text-gray-800">{m.model}</span>
                        <span className="text-gray-500">({m.percentage}%)</span>
                        <span className="font-mono text-zinc-700 font-medium">${m.costUsd}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Action */}
                <div className="pt-2">
                  <button
                    onClick={handleApplyCsv}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg px-6 py-2.5 transition-colors shadow-sm"
                  >
                    {loading ? "Importing…" : "Import & Apply to Dashboard"}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Manual Entry */}
      {activeTab === "manual" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleManualSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  AI Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                >
                  {PROVIDER_OPTIONS.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>
            </div>

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
                  value={manualSpend}
                  onChange={(e) => setManualSpend(e.target.value)}
                  placeholder="e.g. 350.00"
                  required
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Requests Count (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualRequests}
                  onChange={(e) => setManualRequests(e.target.value)}
                  placeholder="e.g. 2400"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Monthly Budget Limit (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualBudget}
                  onChange={(e) => setManualBudget(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading || !manualSpend}
                className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-6 py-2.5 transition-colors shadow-sm"
              >
                {loading ? "Saving…" : "Save & Update Dashboard"}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
