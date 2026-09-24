import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { Report } from "./entities/report.entity";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { CsvGenerator } from "./generators/csv.generator";
import { PdfGenerator } from "./generators/pdf.generator";
import { ReportDeliveryProcessor } from "./workers/report-delivery.processor";
import { ReportDeliveryScheduler } from "./workers/report-delivery.scheduler";
import { REPORT_DELIVERY_QUEUE } from "./workers/report-delivery.queue";
import { UsageModule } from "../usage/usage.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    BullModule.registerQueue({ name: REPORT_DELIVERY_QUEUE }),
    UsageModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    CsvGenerator,
    PdfGenerator,
    ReportDeliveryProcessor,
    ReportDeliveryScheduler,
  ],
  exports: [ReportsService, CsvGenerator, PdfGenerator],
})
export class ReportsModule {}
