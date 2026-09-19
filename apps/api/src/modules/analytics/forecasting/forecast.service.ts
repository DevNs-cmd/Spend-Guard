import { Injectable } from "@nestjs/common";
import { DailyCostPoint } from "../interfaces/usage-source.interface";

export interface MonthEndForecast {
  spentSoFarUsd: number;
  dailyAverageUsd: number;
  daysRemainingInMonth: number;
  projectedTotalUsd: number;
}

/**
 * Deliberately simple (average-daily-spend x days-remaining) rather than a
 * full time-series model — under this deadline a defensible, explainable
 * method beats an unfinished sophisticated one. Swap the projection formula
 * here later without touching any caller.
 */
@Injectable()
export class ForecastService {
  projectMonthEnd(series: DailyCostPoint[], asOf: Date = new Date()): MonthEndForecast {
    if (series.length === 0) {
      return { spentSoFarUsd: 0, dailyAverageUsd: 0, daysRemainingInMonth: 0, projectedTotalUsd: 0 };
    }

    const spentSoFar = series.reduce((sum, p) => sum + p.costUsd, 0);
    const dailyAverage = spentSoFar / series.length;

    const daysInMonth = new Date(asOf.getFullYear(), asOf.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(daysInMonth - asOf.getDate(), 0);

    const projectedTotal = spentSoFar + dailyAverage * daysRemaining;

    return {
      spentSoFarUsd: round2(spentSoFar),
      dailyAverageUsd: round2(dailyAverage),
      daysRemainingInMonth: daysRemaining,
      projectedTotalUsd: round2(projectedTotal),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
