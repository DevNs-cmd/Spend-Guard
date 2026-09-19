import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { BUDGET_CHECK_QUEUE, BudgetCheckJobData } from "./budget-check.queue";

@Injectable()
export class BudgetCheckScheduler {
  private readonly logger = new Logger(BudgetCheckScheduler.name);

  constructor(
    @InjectQueue(BUDGET_CHECK_QUEUE)
    private readonly queue: Queue<BudgetCheckJobData>,
  ) {}

  @Cron("*/15 * * * *") // Check every 15 minutes
  async enqueueThresholdChecks(): Promise<void> {
    this.logger.log("Enqueuing scheduled budget threshold check job");
    await this.queue.add(
      "check-thresholds",
      { triggeredBy: "cron-scheduler" },
      {
        removeOnComplete: true,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    );
  }
}
