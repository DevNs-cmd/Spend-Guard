import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { ReportsService } from "../reports.service";
import { REPORT_DELIVERY_QUEUE, ReportDeliveryJobData } from "./report-delivery.queue";

@Processor(REPORT_DELIVERY_QUEUE)
export class ReportDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportDeliveryProcessor.name);

  constructor(private readonly reportsService: ReportsService) {
    super();
  }

  async process(job: Job<ReportDeliveryJobData>): Promise<{ processedCount: number }> {
    this.logger.log(`Processing report delivery job [${job.id}]`);
    try {
      const result = await this.reportsService.processScheduledReports();
      this.logger.log(`Report delivery job completed: processed ${result.processedCount} report(s)`);
      return result;
    } catch (err) {
      this.logger.error(`Report delivery job failed: ${(err as Error).message}`);
      throw err;
    }
  }
}
