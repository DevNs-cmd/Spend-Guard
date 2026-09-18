import { NormalizedUsageRow } from "@spendguard/shared-types";

/**
 * Every provider connector implements this. `fetchUsage` must:
 *  - only return usage for the window [since, now)
 *  - never throw for "no data in this window" (return an empty array instead)
 *  - throw only for genuine failures (auth error, network error, malformed
 *    response) so the sync worker can log + retry correctly
 */
export interface ProviderConnector {
  fetchUsage(
    connectionId: string,
    organizationId: string,
    since: Date,
  ): Promise<NormalizedUsageRow[]>;
}

export class ProviderAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderAuthError";
  }
}

export class ProviderApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ProviderApiError";
  }
}
