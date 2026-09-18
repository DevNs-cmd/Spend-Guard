// New file (additive) — the common shape every provider connector normalizes
// usage into before handing it to UsageService.ingest(). Lives here so
// Krrish's providers module and Vedant's usage module import the same type
// instead of each defining their own.
import { Provider } from "../enums/provider.enum";

export interface NormalizedUsageRow {
  providerConnectionId: string;
  organizationId: string;
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  requestCount: number;
  costUsd?: number; // some providers (e.g. Gemini via billing export) report cost directly
  occurredAt: Date;
}
