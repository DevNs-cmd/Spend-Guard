import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { BudgetsService } from "../budgets.service";
import { BUDGET_CHECK_QUEUE, BudgetCheckJobData } from "./budget-check.queue";

@Processor(BUDGET_CHECK_QUEUE)
export class BudgetCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(BudgetCheckProcessor.name);

  constructor(private readonly budgetsService: BudgetsService) {
    super();
  }

  async process(job: Job<BudgetCheckJobData>): Promise<{ checkedBudgets: number; alertsFired: number }> {
    this.logger.log(`Processing scheduled budget threshold check job [${job.id}]`);
    try {
      const result = await this.budgetsService.checkThresholds();
      this.logger.log(
        `Budget check completed: checked ${result.checkedBudgets} budget(s), fired ${result.alertsFired} alert(s)`,
      );
      return result;
    } catch (err) {
      this.logger.error(`Budget check job failed: ${(err as Error).message}`);
      throw err; // Allow BullMQ retry strategy
    }
  }
}
