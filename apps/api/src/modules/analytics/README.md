# modules/analytics — Owner: Krrish

Full task detail: `/docs/team/KRRISH_README.md`.

## What's implemented here
- `GET /analytics/trends`, `/forecast`, `/anomalies`, `/month-over-month`
- `ForecastService` — average-daily-spend × days-remaining month-end projection
- `AnomalyDetectorService` — z-score based spend-spike detection
- `AnalyticsService` — orchestrates both against a `UsageSourcePort`

## Integration point — coordinate with Vedant
Depends on two methods that don't exist yet on `UsageService` (see
`interfaces/usage-source.interface.ts` for exact signatures):
`getDailyCostSeries(...)` and `getBreakdown(...)`.

`analytics.module.ts` binds `USAGE_SOURCE` to Vedant's real `UsageService` via
NestJS `useExisting`, which is why this compiles today even though those
methods aren't implemented yet — calling them will only fail at **runtime**
until Vedant adds them. Show him this interface file before wiring this up
against a live database.
