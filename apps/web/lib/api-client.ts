// Mock data & API client with live/mock fallback. Owner: Anuj.
// Uses types from packages/shared-types. Do not redefine DTOs here.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ── Types (extending shared-types for frontend needs) ──────────────────────

export interface UsageSummary {
  totalSpendUsd: number;
  totalRequests: number;
  totalTokens: number;
  avgCostPerRequestUsd: number;
  spendChangePercent: number;
  requestsChangePercent: number;
  tokensChangePercent: number;
}

export interface ProviderConnection {
  id: string;
  provider: "openai" | "anthropic" | "gemini" | "mistral" | "azure" | "bedrock";
  label: string;
  status: "active" | "syncing" | "error" | "disconnected";
  lastSyncAt: string | null;
  modelsCount: number;
}

export interface SpendDataPoint {
  date: string;
  amount: number;
}

export interface ModelBreakdown {
  model: string;
  provider: string;
  costUsd: number;
  requests: number;
  tokens: number;
  percentage: number;
}

export interface UsageRecord {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  project: string;
  user: string;
  tags: string[];
}

export interface Budget {
  id: string;
  name: string;
  scope: "organization" | "project" | "team";
  scopeLabel: string;
  softLimitUsd: number;
  hardLimitUsd: number;
  currentSpendUsd: number;
  period: "monthly" | "weekly" | "daily";
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  firedAt: string;
  acknowledged: boolean;
  budgetId?: string;
}

export interface TrendDataPoint {
  date: string;
  actual: number;
  forecast?: number;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  description: string;
  expectedCostUsd: number;
  actualCostUsd: number;
  severity: "high" | "medium" | "low";
  model: string;
}

export interface Recommendation {
  id: string;
  category: "model-downgrade" | "caching" | "routing" | "unused";
  title: string;
  description: string;
  estimatedSavingsUsd: number;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
}

export interface Report {
  id: string;
  name: string;
  type: "executive" | "finance" | "custom";
  schedule: "weekly" | "monthly" | "one-time";
  lastGeneratedAt: string | null;
  format: "pdf" | "csv" | "email";
  status: "active" | "paused";
}

export interface BillingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  limits: {
    providers: number;
    projects: number;
    seats: number;
    retentionDays: number;
  };
  features: string[];
}

export interface CurrentPlan {
  planId: string;
  planName: string;
  usage: {
    providers: { used: number; limit: number };
    projects: { used: number; limit: number };
    seats: { used: number; limit: number };
  };
  currentPeriodEnd: string;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: string;
}

export interface Tag {
  id: string;
  key: string;
  value: string;
  usageCount: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_SUMMARY: UsageSummary = {
  totalSpendUsd: 12458.75,
  totalRequests: 128456,
  totalTokens: 342600000,
  avgCostPerRequestUsd: 0.097,
  spendChangePercent: 8.2,
  requestsChangePercent: 11.3,
  tokensChangePercent: -3.1,
};

const MOCK_PROVIDERS: ProviderConnection[] = [
  { id: "1", provider: "openai", label: "OpenAI Production", status: "active", lastSyncAt: "2026-09-14T06:00:00Z", modelsCount: 8 },
  { id: "2", provider: "anthropic", label: "Anthropic Main", status: "active", lastSyncAt: "2026-09-14T05:45:00Z", modelsCount: 5 },
  { id: "3", provider: "gemini", label: "Google Gemini", status: "active", lastSyncAt: "2026-09-14T05:30:00Z", modelsCount: 4 },
  { id: "4", provider: "mistral", label: "Mistral EU", status: "active", lastSyncAt: "2026-09-14T05:15:00Z", modelsCount: 3 },
];

function generateSpendData(days: number): SpendDataPoint[] {
  const data: SpendDataPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split("T")[0],
      amount: 300 + Math.random() * 200 + (i < 7 ? 50 : 0),
    });
  }
  return data;
}

const MOCK_MODEL_BREAKDOWN: ModelBreakdown[] = [
  { model: "GPT-4o", provider: "openai", costUsd: 5634, requests: 45200, tokens: 120000000, percentage: 45.2 },
  { model: "Claude 3.5 Sonnet", provider: "anthropic", costUsd: 3100, requests: 32100, tokens: 89000000, percentage: 24.9 },
  { model: "Gemini 1.5 Pro", provider: "gemini", costUsd: 1890, requests: 21300, tokens: 56000000, percentage: 15.2 },
  { model: "GPT-4o-mini", provider: "openai", costUsd: 980, requests: 18900, tokens: 45000000, percentage: 7.9 },
  { model: "Claude 3 Haiku", provider: "anthropic", costUsd: 520, requests: 8200, tokens: 22000000, percentage: 4.2 },
  { model: "Mistral Large", provider: "mistral", costUsd: 334.75, requests: 2756, tokens: 10600000, percentage: 2.7 },
];

const MOCK_USAGE_RECORDS: UsageRecord[] = Array.from({ length: 50 }, (_, i) => {
  const models = ["GPT-4o", "Claude 3.5 Sonnet", "Gemini 1.5 Pro", "GPT-4o-mini", "Claude 3 Haiku"];
  const providers = ["openai", "anthropic", "gemini", "openai", "anthropic"];
  const projects = ["Chatbot", "Search", "Content Gen", "Support Bot", "Data Pipeline"];
  const users = ["alice@company.com", "bob@company.com", "charlie@company.com", "diana@company.com"];
  const idx = i % models.length;
  const d = new Date();
  d.setHours(d.getHours() - i * 2);
  return {
    id: `ur-${i + 1}`,
    timestamp: d.toISOString(),
    provider: providers[idx],
    model: models[idx],
    inputTokens: Math.floor(500 + Math.random() * 4000),
    outputTokens: Math.floor(200 + Math.random() * 2000),
    costUsd: parseFloat((0.01 + Math.random() * 0.5).toFixed(4)),
    project: projects[i % projects.length],
    user: users[i % users.length],
    tags: i % 3 === 0 ? ["production"] : i % 3 === 1 ? ["staging", "experiment"] : ["production", "critical"],
  };
});

const MOCK_BUDGETS: Budget[] = [
  { id: "b1", name: "Organization Monthly", scope: "organization", scopeLabel: "Entire Org", softLimitUsd: 10000, hardLimitUsd: 15000, currentSpendUsd: 12458.75, period: "monthly" },
  { id: "b2", name: "Chatbot Project", scope: "project", scopeLabel: "Chatbot", softLimitUsd: 3000, hardLimitUsd: 5000, currentSpendUsd: 2340, period: "monthly" },
  { id: "b3", name: "Search Team", scope: "team", scopeLabel: "Search Engineering", softLimitUsd: 2000, hardLimitUsd: 3000, currentSpendUsd: 1100, period: "monthly" },
  { id: "b4", name: "Content Gen", scope: "project", scopeLabel: "Content Generation", softLimitUsd: 1500, hardLimitUsd: 2000, currentSpendUsd: 890, period: "monthly" },
];

const MOCK_ALERTS: Alert[] = [
  { id: "a1", severity: "critical", title: "Budget exceeded", message: "Organization monthly spend has exceeded the soft limit of $10,000", firedAt: "2026-09-14T08:30:00Z", acknowledged: false, budgetId: "b1" },
  { id: "a2", severity: "warning", title: "Unusual spike detected", message: "GPT-4o requests increased 340% in the last hour", firedAt: "2026-09-14T07:15:00Z", acknowledged: false },
  { id: "a3", severity: "warning", title: "Budget approaching limit", message: "Chatbot project has reached 78% of soft limit", firedAt: "2026-09-13T16:00:00Z", acknowledged: true, budgetId: "b2" },
  { id: "a4", severity: "info", title: "Provider sync completed", message: "Anthropic usage data synced successfully", firedAt: "2026-09-13T12:00:00Z", acknowledged: true },
  { id: "a5", severity: "info", title: "New model detected", message: "GPT-4o-mini-2024-07-18 is now available in your OpenAI account", firedAt: "2026-09-12T09:00:00Z", acknowledged: true },
];

function generateTrendData(): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = 350 + Math.sin(i / 5) * 50;
    data.push({
      date: d.toISOString().split("T")[0],
      actual: i >= 3 ? base + Math.random() * 60 : undefined as unknown as number,
      forecast: i <= 5 ? base + 20 + Math.random() * 40 : undefined,
    });
  }
  return data;
}

const MOCK_ANOMALIES: Anomaly[] = [
  { id: "an1", timestamp: "2026-09-14T07:15:00Z", description: "Unusual request volume — possible runaway loop", expectedCostUsd: 45, actualCostUsd: 198, severity: "high", model: "GPT-4o" },
  { id: "an2", timestamp: "2026-09-13T14:00:00Z", description: "Token output 3x above average for this project", expectedCostUsd: 12, actualCostUsd: 38, severity: "medium", model: "Claude 3.5 Sonnet" },
];

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  { id: "r1", category: "model-downgrade", title: "Switch classification tasks to GPT-4o-mini", description: "42% of GPT-4o requests are simple classification prompts that can be handled by GPT-4o-mini at 1/15th the cost.", estimatedSavingsUsd: 680, impact: "high", effort: "low" },
  { id: "r2", category: "caching", title: "Enable prompt caching for repeated queries", description: "18% of requests have identical prompts. Caching could eliminate redundant API calls.", estimatedSavingsUsd: 420, impact: "medium", effort: "low" },
  { id: "r3", category: "routing", title: "Route simple queries to Gemini Flash", description: "Short, factual queries could use Gemini 1.5 Flash at 1/10th the cost of Claude 3.5 Sonnet.", estimatedSavingsUsd: 310, impact: "medium", effort: "medium" },
  { id: "r4", category: "unused", title: "Remove inactive Mistral connection", description: "The Mistral EU provider has had zero requests in the last 14 days but is still syncing.", estimatedSavingsUsd: 0, impact: "low", effort: "low" },
];

const MOCK_REPORTS: Report[] = [
  { id: "rp1", name: "Weekly Executive Summary", type: "executive", schedule: "weekly", lastGeneratedAt: "2026-09-08T09:00:00Z", format: "pdf", status: "active" },
  { id: "rp2", name: "Monthly Finance Reconciliation", type: "finance", schedule: "monthly", lastGeneratedAt: "2026-09-01T06:00:00Z", format: "csv", status: "active" },
  { id: "rp3", name: "Q3 Cost Analysis", type: "custom", schedule: "one-time", lastGeneratedAt: "2026-08-15T10:00:00Z", format: "pdf", status: "paused" },
];

const MOCK_PLANS: BillingPlan[] = [
  { id: "starter", name: "Starter", priceMonthly: 49, limits: { providers: 2, projects: 2, seats: 3, retentionDays: 30 }, features: ["Basic Reports"] },
  { id: "growth", name: "Growth", priceMonthly: 199, limits: { providers: 5, projects: 10, seats: 10, retentionDays: 90 }, features: ["Advanced Reports", "Alerts & Budgets"] },
  { id: "pro", name: "Pro", priceMonthly: 499, limits: { providers: 15, projects: -1, seats: 25, retentionDays: 365 }, features: ["Anomaly Detection", "Optimization", "Priority Support"] },
  { id: "enterprise", name: "Enterprise", priceMonthly: -1, limits: { providers: -1, projects: -1, seats: -1, retentionDays: -1 }, features: ["Custom Connections", "Advanced Security", "Dedicated Support", "Custom SLAs"] },
];

const MOCK_CURRENT_PLAN: CurrentPlan = {
  planId: "growth",
  planName: "Growth",
  usage: {
    providers: { used: 4, limit: 5 },
    projects: { used: 5, limit: 10 },
    seats: { used: 7, limit: 10 },
  },
  currentPeriodEnd: "2026-10-01T00:00:00Z",
};

const MOCK_MEMBERS: OrgMember[] = [
  { id: "m1", name: "Anuj Sharma", email: "anuj@company.com", role: "owner", joinedAt: "2026-01-15T00:00:00Z" },
  { id: "m2", name: "Neerav Patel", email: "neerav@company.com", role: "admin", joinedAt: "2026-02-01T00:00:00Z" },
  { id: "m3", name: "Krrish Kumar", email: "krrish@company.com", role: "member", joinedAt: "2026-02-15T00:00:00Z" },
  { id: "m4", name: "Vedant Singh", email: "vedant@company.com", role: "member", joinedAt: "2026-03-01T00:00:00Z" },
  { id: "m5", name: "Gauri Desai", email: "gauri@company.com", role: "member", joinedAt: "2026-03-10T00:00:00Z" },
  { id: "m6", name: "Diana Moore", email: "diana@company.com", role: "viewer", joinedAt: "2026-06-01T00:00:00Z" },
];

const MOCK_TAGS: Tag[] = [
  { id: "t1", key: "environment", value: "production", usageCount: 45200 },
  { id: "t2", key: "environment", value: "staging", usageCount: 12300 },
  { id: "t3", key: "feature", value: "chatbot", usageCount: 32100 },
  { id: "t4", key: "feature", value: "search", usageCount: 21300 },
  { id: "t5", key: "team", value: "engineering", usageCount: 56000 },
  { id: "t6", key: "priority", value: "critical", usageCount: 8900 },
];

// ── API Functions ──────────────────────────────────────────────────────────

async function tryFetch<T>(path: string, fallback: T): Promise<T> {
  if (!API_URL) return fallback;
  try {
    const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    return fallback;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
}

// ── Data Fetchers (with mock fallback) ─────────────────────────────────────

export function getUsageSummary(): Promise<UsageSummary> {
  return tryFetch("/usage/summary", MOCK_SUMMARY);
}

export function getProviders(): Promise<ProviderConnection[]> {
  return tryFetch("/providers", MOCK_PROVIDERS);
}

export function getSpendTimeseries(days = 30): Promise<SpendDataPoint[]> {
  return tryFetch(`/usage/spend-timeseries?days=${days}`, generateSpendData(days));
}

export function getModelBreakdown(): Promise<ModelBreakdown[]> {
  return tryFetch("/usage/breakdown", MOCK_MODEL_BREAKDOWN);
}

export function getUsageRecords(): Promise<UsageRecord[]> {
  return tryFetch("/usage/records", MOCK_USAGE_RECORDS);
}

export function getBudgets(): Promise<Budget[]> {
  return tryFetch("/budgets", MOCK_BUDGETS);
}

export function getAlerts(): Promise<Alert[]> {
  return tryFetch("/alerts", MOCK_ALERTS);
}

export function getTrends(): Promise<TrendDataPoint[]> {
  return tryFetch("/analytics/trends", generateTrendData());
}

export function getAnomalies(): Promise<Anomaly[]> {
  return tryFetch("/analytics/anomalies", MOCK_ANOMALIES);
}

export function getRecommendations(): Promise<Recommendation[]> {
  return tryFetch("/recommendations", MOCK_RECOMMENDATIONS);
}

export function getReports(): Promise<Report[]> {
  return tryFetch("/reports", MOCK_REPORTS);
}

export function getPlans(): Promise<BillingPlan[]> {
  return tryFetch("/billing/plans", MOCK_PLANS);
}

export function getCurrentPlan(): Promise<CurrentPlan> {
  return tryFetch("/billing/plan", MOCK_CURRENT_PLAN);
}

export function getMembers(): Promise<OrgMember[]> {
  return tryFetch("/organizations/members", MOCK_MEMBERS);
}

export function getTags(): Promise<Tag[]> {
  return tryFetch("/tags", MOCK_TAGS);
}
