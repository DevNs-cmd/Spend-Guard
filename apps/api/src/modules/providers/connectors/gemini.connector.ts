import { Injectable, Logger } from "@nestjs/common";
import { BigQuery } from "@google-cloud/bigquery";
import { Provider } from "@spendguard/shared-types";
import { NormalizedUsageRow } from "@spendguard/shared-types";
import { ProviderApiError, ProviderConnector } from "./base.connector";

export interface GeminiCredentials {
  gcpProjectId: string;
  billingExportDataset: string; // e.g. "billing_export"
  billingExportTable: string; // e.g. "gcp_billing_export_v1_XXXXXX_XXXXXX_XXXXXX"
  serviceAccountJson: string; // full service-account key JSON, as a string
}

interface BillingExportRow {
  usage_date: { value: string };
  sku_description: string;
  usage_amount: number;
  cost_usd: number;
}

/**
 * Gemini/Google AI has no simple per-key usage REST endpoint like OpenAI or
 * Anthropic — usage and cost are only available via Cloud Billing Export to
 * BigQuery (ai.google.dev/gemini-api/docs/billing). So this connector queries
 * the org's billing export table instead of calling a Gemini API directly.
 *
 * Setup required on the org's side before this works:
 *  1. Enable Cloud Billing Export to BigQuery for the billing account
 *     (standard usage cost export, not just pricing export)
 *  2. Grant a service account "BigQuery Data Viewer" + "BigQuery Job User"
 *     on that dataset, and store its JSON key as `serviceAccountJson`
 *
 * Model-name extraction from `sku.description` (e.g. "Gemini 1.5 Pro Input")
 * is a best-effort text match since Google's billing export doesn't have a
 * clean structured "model" column — treat model-level breakdown here as
 * approximate, cost totals are exact.
 */
@Injectable()
export class GeminiConnector implements ProviderConnector {
  private readonly logger = new Logger(GeminiConnector.name);

  constructor(private readonly credentials: GeminiCredentials) {}

  async fetchUsage(
    connectionId: string,
    organizationId: string,
    since: Date,
  ): Promise<NormalizedUsageRow[]> {
    let bigquery: BigQuery;
    try {
      const keyFile = JSON.parse(this.credentials.serviceAccountJson);
      bigquery = new BigQuery({
        projectId: this.credentials.gcpProjectId,
        credentials: keyFile,
      });
    } catch (err) {
      throw new ProviderApiError(
        `Gemini connector: invalid service account JSON for connection ${connectionId}: ${(err as Error).message}`,
      );
    }

    const table = `\`${this.credentials.gcpProjectId}.${this.credentials.billingExportDataset}.${this.credentials.billingExportTable}\``;

    const query = `
      SELECT
        DATE(usage_start_time) AS usage_date,
        sku.description AS sku_description,
        SUM(usage.amount_in_pricing_units) AS usage_amount,
        SUM(cost) AS cost_usd
      FROM ${table}
      WHERE service.description = 'Generative Language API'
        AND usage_start_time >= @since
      GROUP BY usage_date, sku_description
      ORDER BY usage_date
    `;

    let rowsRaw: BillingExportRow[];
    try {
      const [job] = await bigquery.createQueryJob({
        query,
        params: { since: since.toISOString() },
      });
      const [results] = await job.getQueryResults();
      rowsRaw = results as unknown as BillingExportRow[];
    } catch (err) {
      throw new ProviderApiError(
        `Gemini connector: BigQuery query failed for connection ${connectionId}: ${(err as Error).message}`,
      );
    }

    // Merge input/output line items per (date, model) into one NormalizedUsageRow.
    const merged = new Map<string, NormalizedUsageRow>();

    for (const row of rowsRaw) {
      const description = row.sku_description ?? "";
      const isOutput = /output/i.test(description);
      const isInput = /input/i.test(description);
      const model = description
        .replace(/input/i, "")
        .replace(/output/i, "")
        .trim() || "unknown";
      const dateKey = row.usage_date.value;
      const mapKey = `${dateKey}::${model}`;

      const existing = merged.get(mapKey) ?? {
        providerConnectionId: connectionId,
        organizationId,
        provider: Provider.Gemini,
        model,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        requestCount: 0,
        costUsd: 0,
        occurredAt: new Date(dateKey),
      };

      if (isOutput) {
        existing.outputTokens += row.usage_amount ?? 0;
      } else if (isInput) {
        existing.inputTokens += row.usage_amount ?? 0;
      }
      existing.costUsd = (existing.costUsd ?? 0) + (row.cost_usd ?? 0);

      merged.set(mapKey, existing);
    }

    const rows = Array.from(merged.values());
    this.logger.log(
      `Gemini connector: fetched ${rows.length} usage rows for connection ${connectionId} since ${since.toISOString()}`,
    );
    return rows;
  }
}
