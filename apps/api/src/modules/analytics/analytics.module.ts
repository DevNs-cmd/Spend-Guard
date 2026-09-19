import { Module } from "@nestjs/common";
import { UsageModule } from "../usage/usage.module";
import { UsageService } from "../usage/usage.service";
import { USAGE_SOURCE } from "./interfaces/usage-source.interface";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { ForecastService } from "./forecasting/forecast.service";
import { AnomalyDetectorService } from "./anomaly-detection/anomaly-detector.service";

@Module({
  imports: [UsageModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    ForecastService,
    AnomalyDetectorService,
    // See interfaces/usage-source.interface.ts for the exact methods this
    // needs Vedant's UsageService to expose.
    { provide: USAGE_SOURCE, useExisting: UsageService },
  ],
})
export class AnalyticsModule {}
