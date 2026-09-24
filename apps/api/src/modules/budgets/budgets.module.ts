import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { Budget } from "./entities/budget.entity";
import { Alert } from "./entities/alert.entity";
import { Project } from "../usage/entities/project.entity";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";
import { AlertsService } from "./alerts/alerts.service";
import { EmailNotifier } from "./alerts/notifiers/email.notifier";
import { SlackNotifier } from "./alerts/notifiers/slack.notifier";
import { InAppNotifier } from "./alerts/notifiers/in-app.notifier";
import { BudgetCheckProcessor } from "./workers/budget-check.processor";
import { BudgetCheckScheduler } from "./workers/budget-check.scheduler";
import { BUDGET_CHECK_QUEUE } from "./workers/budget-check.queue";
import { UsageModule } from "../usage/usage.module";
import { AnalyticsModule } from "../analytics/analytics.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, Alert, Project]),
    BullModule.registerQueue({ name: BUDGET_CHECK_QUEUE }),
    UsageModule,
    AnalyticsModule,
  ],
  controllers: [BudgetsController],
  providers: [
    BudgetsService,
    AlertsService,
    EmailNotifier,
    SlackNotifier,
    InAppNotifier,
    BudgetCheckProcessor,
    BudgetCheckScheduler,
  ],
  exports: [BudgetsService, AlertsService],
})
export class BudgetsModule {}
