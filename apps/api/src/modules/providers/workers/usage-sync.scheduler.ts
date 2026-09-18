import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { ProvidersService } from "../providers.service";
import { USAGE_SYNC_QUEUE, UsageSyncJobData } from "./usage-sync.queue";

/**
 * Enqueues one sync job per active ProviderConnection on a schedule. Keeping
 * this separate from the processor means the schedule can change (or a
 * manual "sync now" endpoint can enqueue the same job type) without touching
 * the sync logic itself.
 */
@Injectable()
export class UsageSyncScheduler {
  private readonly logger = new Logger(UsageSyncScheduler.name);

  constructor(
    @InjectQueue(USAGE_SYNC_QUEUE) private readonly queue: Queue<UsageSyncJobData>,
    private readonly providersService: ProvidersService,
  ) {}

  @Cron("*/15 * * * *") // every 15 minutes
  async enqueueSyncJobs(): Promise<void> {
    const connections = await this.providersService.findAllActive();
    this.logger.log(`Enqueuing usage sync for ${connections.length} active connection(s)`);

    for (const connection of connections) {
      await this.queue.add(
        "sync-connection",
        { connectionId: connection.id },
        { removeOnComplete: true, removeOnFail: 50, attempts: 3, backoff: { type: "exponential", delay: 5000 } },
      );
    }
  }
}
