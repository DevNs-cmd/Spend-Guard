import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentOrgContext } from "@spendguard/shared-types";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("analytics")
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("trends")
  trends(
    @CurrentOrg() org: CurrentOrgContext,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.analyticsService.trends(org.organizationId, fromDate, toDate);
  }

  @Get("forecast")
  forecast(@CurrentOrg() org: CurrentOrgContext) {
    return this.analyticsService.forecast(org.organizationId);
  }

  @Get("anomalies")
  anomalies(@CurrentOrg() org: CurrentOrgContext) {
    return this.analyticsService.anomalies(org.organizationId);
  }

  @Get("month-over-month")
  monthOverMonth(@CurrentOrg() org: CurrentOrgContext) {
    return this.analyticsService.monthOverMonth(org.organizationId);
  }
}
