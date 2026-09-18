import { Injectable, Logger } from "@nestjs/common";
import { Provider } from "@spendguard/shared-types";
import { NormalizedUsageRow } from "@spendguard/shared-types";
import { ProviderApiError, ProviderAuthError, ProviderConnector } from "./base.connector";

export interface AnthropicCredentials {
  adminApiKey: string; // starts with sk-ant-admin-... ; a regular API key will NOT work here
}

interface AnthropicUsageResult {
  model?: string;
  input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

interface AnthropicUsageBucket {
  starting_at: string;
  ending_at: string;
  results: AnthropicUsageResult[];
}

interface AnthropicUsageResponse {
  data: AnthropicUsageBucket[];
  has_more: boolean;
  next_page: string | null;
}

const ANTHROPIC_USAGE_URL = "https://api.anthropic.com/v1/organizations/usage_report/messages";
// NOTE: verify against platform.claude.com/docs before shipping — Anthropic's
// admin usage/cost API is comparatively new and field names here follow their
// published Messages-API usage-object convention (input_tokens /
// cache_creation_input_tokens / cache_read_input_tokens / output_tokens).
// If Anthropic's actual response uses different keys, only the field mapping
// below (fetchUsage's inner loop) needs to change — nothing else in this file.
const ANTHROPIC_API_VERSION = "2023-06-01";

/**
 * Pulls token usage from Anthropic's Usage & Cost Admin API, bucketed by day
 * and grouped by model. Requires an Admin API key (sk-ant-admin-...),
 * provisioned by an org admin in the Anthropic Console — a normal API key
 * will be rejected.
 */
@Injectable()
export class AnthropicConnector implements ProviderConnector {
  private readonly logger = new Logger(AnthropicConnector.name);

  constructor(private readonly credentials: AnthropicCredentials) {}

  async fetchUsage(
    connectionId: string,
    organizationId: string,
    since: Date,
  ): Promise<NormalizedUsageRow[]> {
    const rows: NormalizedUsageRow[] = [];
    let page: string | undefined;

    do {
      const url = new URL(ANTHROPIC_USAGE_URL);
      url.searchParams.set("starting_at", since.toISOString());
      url.searchParams.set("bucket_width", "1d");
      url.searchParams.append("group_by", "model");
      if (page) url.searchParams.set("page", page);

      const res = await fetch(url.toString(), {
        headers: {
          "x-api-key": this.credentials.adminApiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401 || res.status === 403) {
        throw new ProviderAuthError(
          `Anthropic rejected the admin API key for connection ${connectionId} (HTTP ${res.status})`,
        );
      }
      if (!res.ok) {
        throw new ProviderApiError(
          `Anthropic usage API returned HTTP ${res.status}`,
          res.status,
        );
      }

      const body = (await res.json()) as AnthropicUsageResponse;

      for (const bucket of body.data ?? []) {
        const occurredAt = new Date(bucket.starting_at);
        for (const result of bucket.results ?? []) {
          const cachedTokens =
            (result.cache_read_input_tokens ?? 0) + (result.cache_creation_input_tokens ?? 0);
          rows.push({
            providerConnectionId: connectionId,
            organizationId,
            provider: Provider.Anthropic,
            model: result.model ?? "unknown",
            inputTokens: result.input_tokens ?? 0,
            outputTokens: result.output_tokens ?? 0,
            cachedTokens,
            requestCount: 0, // Anthropic's usage report doesn't return a request count directly
            occurredAt,
          });
        }
      }

      page = body.has_more ? (body.next_page ?? undefined) : undefined;
    } while (page);

    this.logger.log(
      `Anthropic connector: fetched ${rows.length} usage rows for connection ${connectionId} since ${since.toISOString()}`,
    );
    return rows;
  }
}
