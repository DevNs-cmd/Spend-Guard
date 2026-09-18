import { Inject, Injectable } from "@nestjs/common";
import { USAGE_SOURCE, UsageSourcePort } from "./interfaces/usage-source.interface";
import { ForecastService, MonthEndForecast } from "./forecasting/forecast.service";
import { AnomalyDetectorService, AnomalyPoint } from "./anomaly-detection/anomaly-detector.service";

export interface MonthOverMonth {
  thisMonthTotalUsd: number;
  lastMonthTotalUsd: number;
  percentChange: number | null;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(USAGE_SOURCE) private readonly usageSource: UsageSourcePort,
    private readonly forecastService: ForecastService,
    private readonly anomalyDetector: AnomalyDetectorService,
  ) {}

  async trends(organizationId: string, fromDate: Date, toDate: Date) {
    return this.usageSource.getDailyCostSeries(organizationId, fromDate, toDate);
  }

  async forecast(organizationId: string): Promise<MonthEndForecast> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const series = await this.usageSource.getDailyCostSeries(organizationId, monthStart, now);
    return this.forecastService.projectMonthEnd(series, now);
  }

  async anomalies(organizationId: string): Promise<AnomalyPoint[]> {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const series = await this.usageSource.getDailyCostSeries(organizationId, start, now);
    return this.anomalyDetector.detect(series);
  }

  async monthOverMonth(organizationId: string): Promise<MonthOverMonth> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonth, lastMonth] = await Promise.all([
      this.usageSource.getDailyCostSeries(organizationId, thisMonthStart, now),
      this.usageSource.getDailyCostSeries(organizationId, lastMonthStart, lastMonthEnd),
    ]);

    const thisMonthTotal = thisMonth.reduce((sum, p) => sum + p.costUsd, 0);
    const lastMonthTotal = lastMonth.reduce((sum, p) => sum + p.costUsd, 0);
    const percentChange =
      lastMonthTotal === 0 ? null : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;

    return {
      thisMonthTotalUsd: Math.round(thisMonthTotal * 100) / 100,
      lastMonthTotalUsd: Math.round(lastMonthTotal * 100) / 100,
      percentChange: percentChange === null ? null : Math.round(percentChange * 10) / 10,
    };
  }
}
