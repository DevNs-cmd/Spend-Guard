import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { REPORT_DELIVERY_QUEUE, ReportDeliveryJobData } from "./report-delivery.queue";

@Injectable()
export class ReportDeliveryScheduler {
  private readonly logger = new Logger(ReportDeliveryScheduler.name);

  constructor(
    @InjectQueue(REPORT_DELIVERY_QUEUE)
    private readonly queue: Queue<ReportDeliveryJobData>,
  ) {}

  @Cron("0 8 * * *") // Daily at 8 AM
  async enqueueScheduledReportDelivery(): Promise<void> {
    this.logger.log("Enqueuing scheduled report delivery job");
    await this.queue.add(
      "deliver-reports",
      { triggeredBy: "cron-daily-8am" },
      {
        removeOnComplete: true,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: "exponential", delay: 10000 },
      },
    );
  }
}
