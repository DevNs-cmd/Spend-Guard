import { Injectable } from "@nestjs/common";
import { DailyCostPoint } from "../interfaces/usage-source.interface";

export interface AnomalyPoint {
  date: string;
  costUsd: number;
  zScore: number;
}

/**
 * Flags days whose spend is more than `zThreshold` standard deviations from
 * the series mean. Simple, explainable, and works with as little as a few
 * weeks of data — good enough for a first pass; a seasonal model can replace
 * this later without changing the AnalyticsService caller.
 */
@Injectable()
export class AnomalyDetectorService {
  detect(series: DailyCostPoint[], zThreshold = 2): AnomalyPoint[] {
    if (series.length < 3) return [];

    const values = series.map((p) => p.costUsd);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return [];

    return series
      .map((p) => ({ date: p.date, costUsd: p.costUsd, zScore: (p.costUsd - mean) / stdDev }))
      .filter((p) => Math.abs(p.zScore) >= zThreshold);
  }
}
