export interface UsageInput {
  organizationId: string;
  providerConnectionId: string;
  sourceRecordId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  projectId?: string;
  occurredAt?: Date;
}