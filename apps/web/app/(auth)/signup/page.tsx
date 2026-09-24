"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Database,
} from "lucide-react";
import { setSession } from "@/lib/auth";
import { createNewTenant, importHistoricalData } from "@/lib/tenant-store";
import { useToast } from "@/components/ui/toast";

const PROVIDERS = [
  { key: "openai", label: "OpenAI", defaultModel: "GPT-4o" },
  { key: "anthropic", label: "Anthropic", defaultModel: "Claude 3.5 Sonnet" },
  { key: "gemini", label: "Google Gemini", defaultModel: "Gemini 1.5 Pro" },
  { key: "mistral", label: "Mistral AI", defaultModel: "Mistral Large" },
  { key: "azure", label: "Azure OpenAI", defaultModel: "GPT-4o (Azure)" },
  { key: "bedrock", label: "AWS Bedrock", defaultModel: "Claude 3.5 (Bedrock)" },
];

export default function SignupPage() {
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Existing historical spend till date
  const [hasExistingSpend, setHasExistingSpend] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("GPT-4o");
  const [spendAmount, setSpendAmount] = useState("");
  const [requestsCount, setRequestsCount] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleProviderChange = (newP: string) => {
    setProvider(newP);
    const found = PROVIDERS.find((p) => p.key === newP);
    if (found) setModel(found.defaultModel);
  };

  const handleQuickFill = (type: "nova" | "clean") => {
    if (type === "nova") {
      setOrgName("Nova AI");
      setName("Alex Mercer");
      setEmail("alex@nova.ai");
      setPassword("password123");
      setHasExistingSpend(true);
      setProvider("openai");
      setModel("GPT-4o");
      setSpendAmount("240.50");
      setRequestsCount("1850");
    } else {
      setOrgName("Clean Slate");
      setName("Bob Clean");
      setEmail("bob@cleanslate.io");
      setPassword("password123");
      setHasExistingSpend(false);
      setSpendAmount("");
      setRequestsCount("");
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName.trim()) {
      setError("Please enter your organization name.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newOrgId = `org-${Date.now()}`;
      const newUserId = `user-${Date.now()}`;

      // 1. Initialize tenant
      createNewTenant(newOrgId, orgName.trim(), {
        name: name.trim(),
        email: email.trim(),
      });

      // 2. If user entered their existing spend till date, seed it immediately!
      const spendNum = parseFloat(spendAmount);
      if (hasExistingSpend && !isNaN(spendNum) && spendNum > 0) {
        importHistoricalData(newOrgId, {
          provider: provider as any,
          model: model.trim() || "GPT-4o",
          totalSpendUsd: spendNum,
          requests: requestsCount ? parseInt(requestsCount, 10) : undefined,
        });
      }

      // 3. Set auth session
      setSession(newUserId, newOrgId, orgName.trim(), email.trim(), name.trim(), "owner");

      toast(`Workspace created for ${orgName}!`);
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-zinc-900 text-white">
            <Shield size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">SpendGuard</span>
        </div>

        <h1 className="text-center text-xl font-semibold text-gray-900">
          Create your workspace
        </h1>
        <p className="mt-1 text-center text-xs text-gray-500">
          Track and manage your AI API spending across all providers.
        </p>

        {/* Quick fill buttons */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-[11px] text-gray-400">Quick fill:</span>
          <button
            type="button"
            onClick={() => handleQuickFill("nova")}
            className="text-[11px] font-medium text-zinc-700 bg-white border border-gray-200 hover:bg-gray-100 rounded px-2 py-0.5 transition-colors"
          >
            Nova AI (with existing spend)
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("clean")}
            className="text-[11px] font-medium text-zinc-700 bg-white border border-gray-200 hover:bg-gray-100 rounded px-2 py-0.5 transition-colors"
          >
            Clean Slate ($0)
          </button>
        </div>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-7">
          
          {error && (
            <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization */}
            <div>
              <label htmlFor="org-name" className="block text-xs font-medium text-gray-700 mb-1">
                Organization / Company Name
              </label>
              <input
                id="org-name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Inc."
                required
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800"
              />
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-gray-700 mb-1">
                  Work Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full border border-gray-300 rounded pl-3 pr-9 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-zinc-800 focus:border-zinc-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Existing Data Till Date Section */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setHasExistingSpend(!hasExistingSpend)}
                className="w-full flex items-center justify-between text-left py-1 text-xs font-medium text-zinc-900 hover:text-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Database size={13} className="text-zinc-500" />
                  <span>Have existing spend data till date?</span>
                  <span className="text-[10px] text-gray-400">(optional)</span>
                </div>
                {hasExistingSpend ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {hasExistingSpend && (
                <div className="mt-2.5 p-3 rounded bg-gray-50 border border-gray-200 space-y-3 animate-in fade-in duration-100">
                  <p className="text-[11px] text-gray-500">
                    Enter what you have spent so far to seed your dashboard and charts with your real historical numbers:
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Provider
                      </label>
                      <select
                        value={provider}
                        onChange={(e) => handleProviderChange(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.key} value={p.key}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Primary Model
                      </label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="GPT-4o"
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Spend till date ($)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
                          <DollarSign size={13} />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={spendAmount}
                          onChange={(e) => setSpendAmount(e.target.value)}
                          placeholder="150.00"
                          className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">
                        Estimated Requests
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={requestsCount}
                        onChange={(e) => setRequestsCount(e.target.value)}
                        placeholder="e.g. 1200"
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 text-white text-sm font-medium rounded py-2 px-4 hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? (
                  "Setting up workspace…"
                ) : (
                  <>
                    <span>Create Workspace & Open Dashboard</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-zinc-900 font-medium hover:underline">
                Sign in
              </Link>
            </span>
          </div>

        </div>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Encrypted at rest • No credit card required
        </p>
      </div>
    </div>
  );
}
