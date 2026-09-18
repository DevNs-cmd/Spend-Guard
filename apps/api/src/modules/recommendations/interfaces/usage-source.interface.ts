/**
 * Same coordination note as analytics/interfaces/usage-source.interface.ts —
 * needs Vedant's UsageService to expose getModelUsageAggregates() with this
 * signature.
 */
export interface ModelUsageAggregate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  requestCount: number;
  costUsd: number;
  avgInputTokensPerRequest: number;
}

export const USAGE_SOURCE = Symbol("RECOMMENDATIONS_USAGE_SOURCE");

export interface UsageSourcePort {
  getModelUsageAggregates(
    organizationId: string,
    sinceDays: number,
  ): Promise<ModelUsageAggregate[]>;
}
