import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { ProvidersService } from "../providers.service";
import { ProviderConnection } from "../entities/provider-connection.entity";
import { ConnectorFactory, ProviderCredentials } from "../connectors/connector.factory";
import { UsageService } from "../../usage/usage.service";
import { USAGE_SYNC_QUEUE, UsageSyncJobData } from "./usage-sync.queue";

// First-ever sync (no lastSyncedAt yet) looks back this far.
const DEFAULT_LOOKBACK_HOURS = 24;

@Processor(USAGE_SYNC_QUEUE)
export class UsageSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(UsageSyncProcessor.name);

  constructor(
    private readonly providersService: ProvidersService,
    private readonly connectorFactory: ConnectorFactory,
    private readonly usageService: UsageService,
  ) {
    super();
  }

  async process(job: Job<UsageSyncJobData>): Promise<void> {
    const { connectionId } = job.data;

    let connection: ProviderConnection;
    let credentials: ProviderCredentials;
    try {
      const result = await this.providersService.getDecryptedCredentials(connectionId);
      connection = result.connection;
      credentials = result.credentials;
    } catch (err) {
      this.logger.error(
        `Could not load credentials for connection ${connectionId}: ${(err as Error).message}`,
      );
      return; // nothing to retry — the connection itself is gone/invalid
    }

    const since = connection.lastSyncedAt
      ? new Date(connection.lastSyncedAt)
      : new Date(Date.now() - DEFAULT_LOOKBACK_HOURS * 60 * 60 * 1000);

    try {
      const connector = this.connectorFactory.create(connection.provider, credentials);
      const rows = await connector.fetchUsage(connection.id, connection.organizationId, since);

      if (rows.length > 0) {
        await this.usageService.ingest(
          rows.map((r, i) => ({
            organizationId: r.organizationId,
            providerConnectionId: r.providerConnectionId,
            sourceRecordId: (r as any).sourceRecordId ?? `sync-${r.providerConnectionId}-${r.occurredAt.getTime()}-${i}`,
            model: r.model,
            inputTokens: r.inputTokens,
            outputTokens: r.outputTokens,
            cachedTokens: r.cachedTokens,
            occurredAt: r.occurredAt,
          })),
        );
      }

      await this.providersService.recordSyncSuccess(connection.id, new Date());
      this.logger.log(
        `Synced ${rows.length} row(s) for connection ${connection.id} (${connection.provider})`,
      );
    } catch (err) {
      const message = (err as Error).message;
      await this.providersService.recordSyncError(connection.id, message);
      this.logger.error(
        `Sync failed for connection ${connection.id} (${connection.provider}): ${message}`,
      );
      throw err; // rethrow so BullMQ applies the retry/backoff policy from the job options
    }
  }
}
