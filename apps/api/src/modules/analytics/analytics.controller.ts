// Endpoints: GET /analytics/trends, GET /analytics/forecast, GET /analytics/anomalies
import { Controller, Get } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("trends")
  trends() {
    return this.analyticsService.trends();
  }
}
