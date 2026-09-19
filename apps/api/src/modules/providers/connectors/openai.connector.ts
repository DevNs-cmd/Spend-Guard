import { Injectable, Logger } from "@nestjs/common";
import { Provider } from "@spendguard/shared-types";
import { NormalizedUsageRow } from "@spendguard/shared-types";
import { ProviderApiError, ProviderAuthError, ProviderConnector } from "./base.connector";

export interface OpenAICredentials {
  adminApiKey: string; // starts with sk-admin-... ; must be an Admin API key, not a project key
}

interface OpenAIUsageResult {
  object: string;
  input_tokens: number;
  output_tokens: number;
  num_model_requests: number;
  model: string | null;
  input_cached_tokens?: number;
}

interface OpenAIUsageBucket {
  object: string;
  start_time: number;
  end_time: number;
  results: OpenAIUsageResult[];
}

interface OpenAIUsageResponse {
  object: string;
  data: OpenAIUsageBucket[];
  has_more: boolean;
  next_page: string | null;
}

const OPENAI_USAGE_URL = "https://api.openai.com/v1/organization/usage/completions";

/**
 * Pulls token usage from OpenAI's Usage API (admin-key only), bucketed by day
 * and grouped by model. Docs: platform.openai.com/docs/api-reference/usage.
 *
 * Note: OpenAI recommends the separate Costs API for financial reconciliation
 * (usage and cost can differ slightly). We use the Usage API here because we
 * need per-model token breakdown for attribution; CostCalculatorService
 * (Vedant's module) computes our own $ figure from these tokens so it stays
 * consistent with our own pricing table across all providers.
 */
@Injectable()
export class OpenAIConnector implements ProviderConnector {
  private readonly logger = new Logger(OpenAIConnector.name);

  constructor(private readonly credentials: OpenAICredentials) {}

  async fetchUsage(
    connectionId: string,
    organizationId: string,
    since: Date,
  ): Promise<NormalizedUsageRow[]> {
    const rows: NormalizedUsageRow[] = [];
    let page: string | undefined;
    const startTime = Math.floor(since.getTime() / 1000);

    do {
      const url = new URL(OPENAI_USAGE_URL);
      url.searchParams.set("start_time", String(startTime));
      url.searchParams.set("bucket_width", "1d");
      url.searchParams.append("group_by", "model");
      url.searchParams.set("limit", "31"); // up to ~1 month of daily buckets per page
      if (page) url.searchParams.set("page", page);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.credentials.adminApiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401 || res.status === 403) {
        throw new ProviderAuthError(
          `OpenAI rejected the admin API key for connection ${connectionId} (HTTP ${res.status})`,
        );
      }
      if (!res.ok) {
        throw new ProviderApiError(
          `OpenAI usage API returned HTTP ${res.status}`,
          res.status,
        );
      }

      const body = (await res.json()) as OpenAIUsageResponse;

      for (const bucket of body.data ?? []) {
        const occurredAt = new Date(bucket.start_time * 1000);
        for (const result of bucket.results ?? []) {
          rows.push({
            providerConnectionId: connectionId,
            organizationId,
            provider: Provider.OpenAI,
            model: result.model ?? "unknown",
            inputTokens: result.input_tokens ?? 0,
            outputTokens: result.output_tokens ?? 0,
            cachedTokens: result.input_cached_tokens ?? 0,
            requestCount: result.num_model_requests ?? 0,
            occurredAt,
          });
        }
      }

      page = body.has_more ? (body.next_page ?? undefined) : undefined;
    } while (page);

    this.logger.log(
      `OpenAI connector: fetched ${rows.length} usage rows for connection ${connectionId} since ${since.toISOString()}`,
    );
    return rows;
  }
}
