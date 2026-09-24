import {
  type UsageSummary,
  type ProviderConnection,
  type SpendDataPoint,
  type ModelBreakdown,
  type UsageRecord,
  type Budget,
  type Alert,
  type OrgMember,
  type Tag,
} from "./api-client";

export interface TenantData {
  orgId: string;
  orgName: string;
  hasSkippedOnboarding: boolean;
  summary: UsageSummary;
  providers: ProviderConnection[];
  budgets: Budget[];
  usageRecords: UsageRecord[];
  models: ModelBreakdown[];
  alerts: Alert[];
  members: OrgMember[];
  tags: Tag[];
}

export const DEMO_ORG_ID = "org-demo";

// Pre-seeded data for existing demo company (Acme Inc.)
const DEFAULT_DEMO_TENANT: TenantData = {
  orgId: DEMO_ORG_ID,
  orgName: "Acme Inc.",
  hasSkippedOnboarding: false,
  summary: {
    totalSpendUsd: 12458.75,
    totalRequests: 128456,
    totalTokens: 342600000,
    avgCostPerRequestUsd: 0.097,
    spendChangePercent: 8.2,
    requestsChangePercent: 11.3,
    tokensChangePercent: -3.1,
  },
  providers: [
    { id: "1", provider: "openai", label: "OpenAI Production", status: "active", lastSyncAt: "2026-09-14T06:00:00Z", modelsCount: 8 },
    { id: "2", provider: "anthropic", label: "Anthropic Main", status: "active", lastSyncAt: "2026-09-14T05:45:00Z", modelsCount: 5 },
    { id: "3", provider: "gemini", label: "Google Gemini", status: "active", lastSyncAt: "2026-09-14T05:30:00Z", modelsCount: 4 },
    { id: "4", provider: "mistral", label: "Mistral EU", status: "active", lastSyncAt: "2026-09-14T05:15:00Z", modelsCount: 3 },
  ],
  budgets: [
    { id: "b1", name: "Organization Monthly", scope: "organization", scopeLabel: "Entire Org", softLimitUsd: 10000, hardLimitUsd: 15000, currentSpendUsd: 12458.75, period: "monthly" },
    { id: "b2", name: "Chatbot Project", scope: "project", scopeLabel: "Chatbot", softLimitUsd: 3000, hardLimitUsd: 5000, currentSpendUsd: 2340, period: "monthly" },
    { id: "b3", name: "Search Team", scope: "team", scopeLabel: "Search Engineering", softLimitUsd: 2000, hardLimitUsd: 3000, currentSpendUsd: 1100, period: "monthly" },
    { id: "b4", name: "Content Gen", scope: "project", scopeLabel: "Content Generation", softLimitUsd: 1500, hardLimitUsd: 2000, currentSpendUsd: 890, period: "monthly" },
  ],
  models: [
    { model: "GPT-4o", provider: "openai", costUsd: 5634, requests: 45200, tokens: 120000000, percentage: 45.2 },
    { model: "Claude 3.5 Sonnet", provider: "anthropic", costUsd: 3100, requests: 32100, tokens: 89000000, percentage: 24.9 },
    { model: "Gemini 1.5 Pro", provider: "gemini", costUsd: 1890, requests: 21300, tokens: 56000000, percentage: 15.2 },
    { model: "GPT-4o-mini", provider: "openai", costUsd: 980, requests: 18900, tokens: 45000000, percentage: 7.9 },
    { model: "Claude 3 Haiku", provider: "anthropic", costUsd: 520, requests: 8200, tokens: 22000000, percentage: 4.2 },
    { model: "Mistral Large", provider: "mistral", costUsd: 334.75, requests: 2756, tokens: 10600000, percentage: 2.7 },
  ],
  usageRecords: Array.from({ length: 50 }, (_, i) => {
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
  }),
  alerts: [
    { id: "a1", severity: "critical", title: "Budget exceeded", message: "Organization monthly spend has exceeded the soft limit of $10,000", firedAt: "2026-09-14T08:30:00Z", acknowledged: false, budgetId: "b1" },
    { id: "a2", severity: "warning", title: "Unusual spike detected", message: "GPT-4o requests increased 340% in the last hour", firedAt: "2026-09-14T07:15:00Z", acknowledged: false },
    { id: "a3", severity: "warning", title: "Budget approaching limit", message: "Chatbot project has reached 78% of soft limit", firedAt: "2026-09-13T16:00:00Z", acknowledged: true, budgetId: "b2" },
    { id: "a4", severity: "info", title: "Provider sync completed", message: "Anthropic usage data synced successfully", firedAt: "2026-09-13T12:00:00Z", acknowledged: true },
    { id: "a5", severity: "info", title: "New model detected", message: "GPT-4o-mini-2024-07-18 is now available in your OpenAI account", firedAt: "2026-09-12T09:00:00Z", acknowledged: true },
  ],
  members: [
    { id: "m1", name: "Anuj Shukla", email: "anuj@company.com", role: "owner", joinedAt: "2026-01-15T00:00:00Z" },
    { id: "m2", name: "Sarah Connor", email: "sarah@company.com", role: "admin", joinedAt: "2026-02-01T00:00:00Z" },
    { id: "m3", name: "David Miller", email: "david@company.com", role: "member", joinedAt: "2026-03-10T00:00:00Z" },
    { id: "m4", name: "Viewer User", email: "viewer@company.com", role: "viewer", joinedAt: "2026-04-05T00:00:00Z" },
  ],
  tags: [
    { id: "t1", key: "environment", value: "production", usageCount: 89400 },
    { id: "t2", key: "environment", value: "staging", usageCount: 23100 },
    { id: "t3", key: "project", value: "chatbot", usageCount: 45200 },
    { id: "t4", key: "team", value: "ai-core", usageCount: 67800 },
  ],
};

function getStorageKey(orgId: string): string {
  return `sg_tenant_${orgId}`;
}

export function getTenantData(orgId: string = DEMO_ORG_ID): TenantData {
  if (typeof window === "undefined") {
    return DEFAULT_DEMO_TENANT;
  }

  const stored = localStorage.getItem(getStorageKey(orgId));
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  if (orgId === DEMO_ORG_ID) {
    localStorage.setItem(getStorageKey(DEMO_ORG_ID), JSON.stringify(DEFAULT_DEMO_TENANT));
    return DEFAULT_DEMO_TENANT;
  }

  // If unknown new org not in storage, create empty clean slate
  const freshTenant: TenantData = {
    orgId,
    orgName: "New Workspace",
    hasSkippedOnboarding: false,
    summary: {
      totalSpendUsd: 0,
      totalRequests: 0,
      totalTokens: 0,
      avgCostPerRequestUsd: 0,
      spendChangePercent: 0,
      requestsChangePercent: 0,
      tokensChangePercent: 0,
    },
    providers: [],
    budgets: [],
    usageRecords: [],
    models: [],
    alerts: [],
    members: [],
    tags: [],
  };

  localStorage.setItem(getStorageKey(orgId), JSON.stringify(freshTenant));
  return freshTenant;
}

export function saveTenantData(orgId: string, data: TenantData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(orgId), JSON.stringify(data));
}

export function createNewTenant(orgId: string, orgName: string, initialUser: { name: string; email: string }): TenantData {
  const newTenant: TenantData = {
    orgId,
    orgName,
    hasSkippedOnboarding: false,
    summary: {
      totalSpendUsd: 0,
      totalRequests: 0,
      totalTokens: 0,
      avgCostPerRequestUsd: 0,
      spendChangePercent: 0,
      requestsChangePercent: 0,
      tokensChangePercent: 0,
    },
    providers: [],
    budgets: [],
    usageRecords: [],
    models: [],
    alerts: [],
    members: [
      {
        id: `m-${Date.now()}`,
        name: initialUser.name,
        email: initialUser.email,
        role: "owner",
        joinedAt: new Date().toISOString(),
      },
    ],
    tags: [
      { id: `t-1`, key: "environment", value: "production", usageCount: 0 },
      { id: `t-2`, key: "environment", value: "staging", usageCount: 0 },
    ],
  };

  saveTenantData(orgId, newTenant);
  return newTenant;
}

export function setTenantSkipped(orgId: string, skipped: boolean): void {
  const tenant = getTenantData(orgId);
  tenant.hasSkippedOnboarding = skipped;
  saveTenantData(orgId, tenant);
}

export function addTenantProvider(
  orgId: string,
  providerData: { provider: ProviderConnection["provider"]; label: string }
): ProviderConnection {
  const tenant = getTenantData(orgId);
  tenant.hasSkippedOnboarding = false;

  const newConn: ProviderConnection = {
    id: `p-${Date.now()}`,
    provider: providerData.provider,
    label: providerData.label,
    status: "active",
    lastSyncAt: new Date().toISOString(),
    modelsCount: 2,
  };

  tenant.providers = [...tenant.providers, newConn];

  // If this was an empty new tenant, generate tailored initial telemetry for this specific provider!
  if (tenant.summary.totalSpendUsd === 0) {
    const defaultModel =
      providerData.provider === "openai"
        ? "GPT-4o"
        : providerData.provider === "anthropic"
        ? "Claude 3.5 Sonnet"
        : providerData.provider === "gemini"
        ? "Gemini 1.5 Pro"
        : "Mistral Large";

    const cost = 42.85;
    const reqs = 340;
    const tokens = 820000;

    tenant.summary = {
      totalSpendUsd: cost,
      totalRequests: reqs,
      totalTokens: tokens,
      avgCostPerRequestUsd: cost / reqs,
      spendChangePercent: 0,
      requestsChangePercent: 0,
      tokensChangePercent: 0,
    };

    tenant.models = [
      {
        model: defaultModel,
        provider: providerData.provider,
        costUsd: cost,
        requests: reqs,
        tokens,
        percentage: 100,
      },
    ];

    tenant.usageRecords = Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - i * 3);
      return {
        id: `ur-new-${i + 1}`,
        timestamp: d.toISOString(),
        provider: providerData.provider,
        model: defaultModel,
        inputTokens: Math.floor(800 + Math.random() * 2000),
        outputTokens: Math.floor(300 + Math.random() * 1000),
        costUsd: parseFloat((0.02 + Math.random() * 0.08).toFixed(4)),
        project: "Production App",
        user: tenant.members[0]?.email || "user@domain.com",
        tags: ["production"],
      };
    });
  }

  saveTenantData(orgId, tenant);
  return newConn;
}

export function deleteTenantProvider(orgId: string, providerId: string): void {
  const tenant = getTenantData(orgId);
  tenant.providers = tenant.providers.filter((p) => p.id !== providerId);
  saveTenantData(orgId, tenant);
}

export function addTenantBudget(orgId: string, budgetData: Omit<Budget, "id" | "currentSpendUsd" | "period">): Budget {
  const tenant = getTenantData(orgId);
  tenant.hasSkippedOnboarding = false;

  const newBudget: Budget = {
    id: `b-${Date.now()}`,
    name: budgetData.name,
    scope: budgetData.scope,
    scopeLabel: budgetData.scopeLabel || budgetData.name,
    softLimitUsd: budgetData.softLimitUsd,
    hardLimitUsd: budgetData.hardLimitUsd,
    currentSpendUsd: tenant.summary.totalSpendUsd,
    period: "monthly",
  };

  tenant.budgets = [...tenant.budgets, newBudget];
  saveTenantData(orgId, tenant);
  return newBudget;
}

export function updateTenantBudget(orgId: string, budget: Budget): void {
  const tenant = getTenantData(orgId);
  tenant.budgets = tenant.budgets.map((b) => (b.id === budget.id ? budget : b));
  saveTenantData(orgId, tenant);
}

export function deleteTenantBudget(orgId: string, budgetId: string): void {
  const tenant = getTenantData(orgId);
  tenant.budgets = tenant.budgets.filter((b) => b.id !== budgetId);
  saveTenantData(orgId, tenant);
}

export interface HistoricalDataInput {
  provider: ProviderConnection["provider"];
  model: string;
  totalSpendUsd: number;
  requests?: number;
  tokens?: number;
  budgetLimit?: number;
  customRecords?: UsageRecord[];
  customModels?: ModelBreakdown[];
}

export function importHistoricalData(orgId: string, data: HistoricalDataInput): TenantData {
  const tenant = getTenantData(orgId);
  tenant.hasSkippedOnboarding = false;

  const spend = Math.max(0, Number(data.totalSpendUsd) || 0);
  const requests = data.requests ? Number(data.requests) : Math.max(1, Math.round(spend * 9.2));
  const tokens = data.tokens ? Number(data.tokens) : Math.max(1000, Math.round(spend * 28000));
  const avgCost = requests > 0 ? parseFloat((spend / requests).toFixed(4)) : 0;

  tenant.summary = {
    totalSpendUsd: spend,
    totalRequests: requests,
    totalTokens: tokens,
    avgCostPerRequestUsd: avgCost,
    spendChangePercent: 4.5,
    requestsChangePercent: 6.2,
    tokensChangePercent: 3.1,
  };

  const providerLabels: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    gemini: "Google Gemini",
    mistral: "Mistral AI",
    azure: "Azure OpenAI",
    bedrock: "AWS Bedrock",
  };

  // Ensure primary provider is connected
  const existingProvider = tenant.providers.find((p) => p.provider === data.provider);
  if (!existingProvider) {
    tenant.providers.push({
      id: `p-${Date.now()}`,
      provider: data.provider,
      label: `${providerLabels[data.provider] || data.provider} Production`,
      status: "active",
      lastSyncAt: new Date().toISOString(),
      modelsCount: 3,
    });
  }

  // If custom records provided from CSV, add any other providers found
  if (data.customRecords && data.customRecords.length > 0) {
    tenant.usageRecords = data.customRecords;
    const uniqueProviders = [...new Set(data.customRecords.map((r) => r.provider))];
    uniqueProviders.forEach((prov) => {
      if (!tenant.providers.some((p) => p.provider === prov)) {
        tenant.providers.push({
          id: `p-${Date.now()}-${prov}`,
          provider: prov as any,
          label: `${providerLabels[prov] || prov} Production`,
          status: "active",
          lastSyncAt: new Date().toISOString(),
          modelsCount: 2,
        });
      }
    });
  } else {
    // Generated usage records
    const userEmail = tenant.members[0]?.email || "you@company.com";
    tenant.usageRecords = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - i * 4);
      const itemCost = parseFloat(((spend / 12) * (0.6 + Math.random() * 0.8)).toFixed(4));
      return {
        id: `ur-imp-${i + 1}`,
        timestamp: d.toISOString(),
        provider: data.provider,
        model: data.model || "GPT-4o",
        inputTokens: Math.floor(tokens / 24),
        outputTokens: Math.floor(tokens / 48),
        costUsd: itemCost,
        project: "Production API",
        user: userEmail,
        tags: ["production"],
      };
    });
  }

  // Models breakdown
  if (data.customModels && data.customModels.length > 0) {
    tenant.models = data.customModels;
  } else {
    tenant.models = [
      {
        model: data.model || "GPT-4o",
        provider: data.provider,
        costUsd: spend,
        requests,
        tokens,
        percentage: 100,
      },
    ];
  }

  // If budget limit was provided, add or update budget
  if (data.budgetLimit && data.budgetLimit > 0) {
    const existingBudget = tenant.budgets.find((b) => b.scope === "organization");
    if (existingBudget) {
      existingBudget.hardLimitUsd = data.budgetLimit;
      existingBudget.softLimitUsd = Math.round(data.budgetLimit * 0.8);
      existingBudget.currentSpendUsd = spend;
    } else {
      tenant.budgets.push({
        id: `b-${Date.now()}`,
        name: "Monthly Spend Budget",
        scope: "organization",
        scopeLabel: "Entire Org",
        softLimitUsd: Math.round(data.budgetLimit * 0.8),
        hardLimitUsd: data.budgetLimit,
        currentSpendUsd: spend,
        period: "monthly",
      });
    }
  } else {
    // Update existing budgets' current spend
    tenant.budgets = tenant.budgets.map((b) => ({ ...b, currentSpendUsd: spend }));
  }

  saveTenantData(orgId, tenant);
  return tenant;
}

