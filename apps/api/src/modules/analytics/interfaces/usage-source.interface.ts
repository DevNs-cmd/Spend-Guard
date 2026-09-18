/**
 * The data contract Krrish's analytics/recommendations modules need from
 * Vedant's UsageService. Vedant's usage.service.ts currently only has
 * ingest()/summary()/breakdown() with no params (see /docs/team/VEDANT_README.md
 * task list) — these two methods need to be added there with these exact
 * signatures before this module is wired to the real UsageService.
 *
 * Until then, AnalyticsModule binds USAGE_SOURCE to Vedant's UsageService via
 * `useExisting` (see analytics.module.ts). That compiles independently of
 * what UsageService currently implements — calling a method that doesn't
 * exist yet will only fail at runtime, not at build time — so coordinate
 * with Vedant before flipping this on in a real environment.
 */

export interface DailyCostPoint {
  date: string; // YYYY-MM-DD
  costUsd: number;
  tokens: number;
}

export type BreakdownDimension = "provider" | "model" | "project" | "tag";

export interface BreakdownRow {
  dimensionValue: string;
  costUsd: number;
  tokens: number;
  requests: number;
}

export const USAGE_SOURCE = Symbol("USAGE_SOURCE");

export interface UsageSourcePort {
  /** Daily total spend for the org between fromDate and toDate (inclusive). */
  getDailyCostSeries(
    organizationId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<DailyCostPoint[]>;

  /** Spend/tokens grouped by the given dimension over an optional date range. */
  getBreakdown(
    organizationId: string,
    by: BreakdownDimension,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<BreakdownRow[]>;
}
