"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Plug,
  Wallet,
  UserPlus,
  CheckCircle,
  ArrowRight,
  SkipForward,
  BarChart3,
  Bell,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

const PROVIDER_OPTIONS = [
  { key: "openai", label: "OpenAI" },
  { key: "anthropic", label: "Anthropic" },
  { key: "gemini", label: "Google Gemini" },
  { key: "mistral", label: "Mistral AI" },
  { key: "azure", label: "Azure OpenAI" },
  { key: "bedrock", label: "AWS Bedrock" },
];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { toast } = useToast();

  // Step 2: Provider
  const [providerKey, setProviderKey] = useState("");
  const [providerLabel, setProviderLabel] = useState("");
  const [providerApiKey, setProviderApiKey] = useState("");
  const [providerConnected, setProviderConnected] = useState(false);

  // Step 3: Budget
  const [budgetName, setBudgetName] = useState("Monthly Budget");
  const [budgetSoft, setBudgetSoft] = useState("");
  const [budgetHard, setBudgetHard] = useState("");
  const [budgetCreated, setBudgetCreated] = useState(false);

  // Step 4: Invite
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // Track what was configured for summary
  const summary = {
    provider: providerConnected,
    budget: budgetCreated,
    invites: invites.length,
  };

  const handleConnectProvider = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to POST /providers (Krrish's endpoint)
    setProviderConnected(true);
    toast(`${PROVIDER_OPTIONS.find((p) => p.key === providerKey)?.label || providerKey} connected!`);
  };

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to POST /budgets (Gauri's endpoint)
    setBudgetCreated(true);
    toast("Budget created!");
  };

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInvites([...invites, { email: inviteEmail, role: inviteRole }]);
    toast(`Invite added for ${inviteEmail}`);
    setInviteEmail("");
  };

  const handleFinish = () => {
    router.push("/");
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded bg-zinc-900 text-white">
            <Shield size={18} />
          </div>
          <span className="text-xl font-semibold text-gray-900">SpendGuard</span>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i + 1 <= step ? "bg-zinc-900" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to SpendGuard! 👋
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Let&apos;s set up your workspace in a few quick steps. You can always change these settings later.
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { icon: BarChart3, text: "Track AI API costs across all your providers in real time" },
                  { icon: Bell, text: "Set budgets and get alerts before you overspend" },
                  { icon: TrendingUp, text: "Get optimization recommendations to reduce costs" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <Icon size={16} className="text-zinc-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{text}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 text-white text-sm font-medium rounded px-4 py-2 hover:bg-zinc-800 transition-colors"
              >
                Get Started
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ── Step 2: Connect Provider ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Plug size={16} className="text-zinc-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Connect Your First Provider
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Connect an AI provider to start tracking usage and costs.
              </p>

              {providerConnected ? (
                <div className="border border-green-200 bg-green-50 rounded-lg px-4 py-3 flex items-center gap-2 mb-5">
                  <CheckCircle size={16} className="text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    Provider connected successfully!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConnectProvider} className="space-y-4 mb-5">
                  <div>
                    <label htmlFor="ob-provider" className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <select
                      id="ob-provider"
                      value={providerKey}
                      onChange={(e) => setProviderKey(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="">Select a provider</option>
                      {PROVIDER_OPTIONS.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ob-label" className="block text-sm font-medium text-gray-700 mb-1">
                      Label (optional)
                    </label>
                    <input
                      id="ob-label"
                      type="text"
                      value={providerLabel}
                      onChange={(e) => setProviderLabel(e.target.value)}
                      placeholder="e.g. Production OpenAI"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="ob-apikey" className="block text-sm font-medium text-gray-700 mb-1">
                      API Key
                    </label>
                    <input
                      id="ob-apikey"
                      type="password"
                      value={providerApiKey}
                      onChange={(e) => setProviderApiKey(e.target.value)}
                      placeholder="sk-••••••••••••••••"
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Your key is encrypted at rest and never stored in plain text.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-zinc-900 text-white text-sm font-medium rounded px-4 py-2 hover:bg-zinc-800 transition-colors"
                  >
                    Connect Provider
                  </button>
                </form>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(3)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded px-4 py-2 transition-colors ${
                    providerConnected
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {providerConnected ? "Continue" : "Skip for now"}
                  {providerConnected ? <ArrowRight size={14} /> : <SkipForward size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Budget ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={16} className="text-zinc-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Set a Spending Budget
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Set a monthly budget to control costs. You&apos;ll get alerts when you approach the limit.
              </p>

              {budgetCreated ? (
                <div className="border border-green-200 bg-green-50 rounded-lg px-4 py-3 flex items-center gap-2 mb-5">
                  <CheckCircle size={16} className="text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    Budget created! You&apos;ll be alerted at ${budgetSoft}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateBudget} className="space-y-4 mb-5">
                  <div>
                    <label htmlFor="ob-budget-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Budget name
                    </label>
                    <input
                      id="ob-budget-name"
                      type="text"
                      value={budgetName}
                      onChange={(e) => setBudgetName(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ob-soft" className="block text-sm font-medium text-gray-700 mb-1">
                        Alert at ($)
                      </label>
                      <input
                        id="ob-soft"
                        type="number"
                        value={budgetSoft}
                        onChange={(e) => setBudgetSoft(e.target.value)}
                        required
                        min="0"
                        placeholder="5000"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="ob-hard" className="block text-sm font-medium text-gray-700 mb-1">
                        Hard limit ($)
                      </label>
                      <input
                        id="ob-hard"
                        type="number"
                        value={budgetHard}
                        onChange={(e) => setBudgetHard(e.target.value)}
                        required
                        min="0"
                        placeholder="10000"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-zinc-900 text-white text-sm font-medium rounded px-4 py-2 hover:bg-zinc-800 transition-colors"
                  >
                    Create Budget
                  </button>
                </form>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="border border-gray-300 text-gray-700 text-sm font-medium rounded px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded px-4 py-2 transition-colors ${
                    budgetCreated
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {budgetCreated ? "Continue" : "Skip for now"}
                  {budgetCreated ? <ArrowRight size={14} /> : <SkipForward size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Invite Team ── */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <UserPlus size={16} className="text-zinc-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Invite Your Team
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                Add team members to collaborate on cost management.
              </p>

              <form onSubmit={handleAddInvite} className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  required
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  className="bg-zinc-900 text-white text-sm font-medium rounded px-3 py-2 hover:bg-zinc-800 transition-colors"
                >
                  Add
                </button>
              </form>

              {invites.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
                  {invites.map((inv, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-sm text-gray-900">{inv.email}</span>
                      <span className="text-xs text-gray-500 capitalize bg-gray-100 px-1.5 py-0.5 rounded">
                        {inv.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(3)}
                  className="border border-gray-300 text-gray-700 text-sm font-medium rounded px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded px-4 py-2 transition-colors ${
                    invites.length > 0
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {invites.length > 0 ? "Continue" : "Skip for now"}
                  {invites.length > 0 ? <ArrowRight size={14} /> : <SkipForward size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: All Set ── */}
          {step === 5 && (
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto mb-4">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                You&apos;re all set!
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Your workspace is ready. Here&apos;s what you configured:
              </p>

              <div className="text-left space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className={summary.provider ? "text-green-600" : "text-gray-400"}>
                    {summary.provider ? "✓" : "–"}
                  </span>
                  <span className={summary.provider ? "text-gray-900" : "text-gray-400"}>
                    {summary.provider ? "AI provider connected" : "No provider connected (add one in Settings)"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={summary.budget ? "text-green-600" : "text-gray-400"}>
                    {summary.budget ? "✓" : "–"}
                  </span>
                  <span className={summary.budget ? "text-gray-900" : "text-gray-400"}>
                    {summary.budget ? "Spending budget configured" : "No budget set (add one in Budgets)"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={summary.invites > 0 ? "text-green-600" : "text-gray-400"}>
                    {summary.invites > 0 ? "✓" : "–"}
                  </span>
                  <span className={summary.invites > 0 ? "text-gray-900" : "text-gray-400"}>
                    {summary.invites > 0
                      ? `${summary.invites} team member${summary.invites > 1 ? "s" : ""} invited`
                      : "No team invites sent (invite from Settings)"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 text-white text-sm font-medium rounded px-4 py-2 hover:bg-zinc-800 transition-colors"
              >
                Go to Dashboard
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Step indicator text */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>
    </div>
  );
}
