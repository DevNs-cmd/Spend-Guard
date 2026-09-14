"use client";

import { useEffect, useState } from "react";
import {
  getProviders,
  type ProviderConnection,
} from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { Plus, RefreshCw, Trash2, CheckCircle, AlertCircle, Loader2, XCircle } from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  mistral: "Mistral AI",
  azure: "Azure OpenAI",
  bedrock: "AWS Bedrock",
};

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string; textClass: string; iconClass?: string }
> = {
  active: { icon: CheckCircle, label: "Active", textClass: "text-emerald-600" },
  syncing: { icon: Loader2, label: "Syncing", textClass: "text-blue-600", iconClass: "animate-spin" },
  error: { icon: AlertCircle, label: "Error", textClass: "text-red-600" },
  disconnected: { icon: XCircle, label: "Disconnected", textClass: "text-gray-400" },
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newProvider, setNewProvider] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newApiKey, setNewApiKey] = useState("");

  useEffect(() => {
    getProviders().then((data) => {
      setProviders(data);
      setLoading(false);
    });
  }, []);

  const handleSync = (id: string) => {
    setSyncingId(id);
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "syncing" } : p))
    );
    setTimeout(() => {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: "active", lastSyncAt: new Date().toISOString() }
            : p
        )
      );
      setSyncingId(null);
    }, 1500);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const connection: ProviderConnection = {
      id: `new-${Date.now()}`,
      provider: newProvider as ProviderConnection["provider"],
      label: newLabel || PROVIDER_LABELS[newProvider] || newProvider,
      status: "active",
      lastSyncAt: new Date().toISOString(),
      modelsCount: 4,
    };
    setProviders([...providers, connection]);
    setShowDialog(false);
    setNewProvider("");
    setNewLabel("");
    setNewApiKey("");
  };

  const handleDelete = (id: string) => {
    setProviders(providers.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Providers</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Providers</h1>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-3 py-1.5 hover:bg-brand-700 transition-colors"
        >
          <Plus size={14} />
          Connect Provider
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500 mb-3">No providers connected yet.</p>
          <button
            onClick={() => setShowDialog(true)}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Connect your first provider →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((p) => {
            const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.disconnected;
            const StatusIcon = status.icon;
            return (
              <div
                key={p.id}
                className="border border-gray-200 rounded-lg px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {p.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {PROVIDER_LABELS[p.provider] || p.provider}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${status.textClass}`}>
                        <StatusIcon size={12} className={status.iconClass || ""} />
                        <span>{status.label}</span>
                      </span>
                      {p.lastSyncAt && (
                        <span className="text-xs text-gray-400">
                          Last sync: {formatDateTime(p.lastSyncAt)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {p.modelsCount} model{p.modelsCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(p.id)}
                    disabled={syncingId === p.id}
                    className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-50 transition-colors"
                    title="Sync now"
                  >
                    <RefreshCw
                      size={14}
                      className={syncingId === p.id ? "animate-spin text-zinc-900" : ""}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowDialog(false)}
          />
          <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Connect Provider
            </h2>
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label
                  htmlFor="provider-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Provider
                </label>
                <select
                  id="provider-select"
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">Select a provider</option>
                  {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="provider-label"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Label (optional)
                </label>
                <input
                  id="provider-label"
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Production OpenAI"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label
                  htmlFor="api-key"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  API Key
                </label>
                <input
                  id="api-key"
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="sk-••••••••••••••••"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Your key is encrypted at rest and never stored in plain text.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium rounded px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 transition-colors"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
