# modules/recommendations — Owner: Krrish

Full task detail: `/docs/team/KRRISH_README.md`.

## What's implemented here
- `GET /recommendations`
- `RecommendationEngineService` — rule-based: cheaper-model suggestions
  (with $ savings estimate from Vedant's `PRICING_TABLE`), caching-opportunity
  flags for high-volume models, prompt-bloat flags for high-average-token calls

## Integration point — coordinate with Vedant
Depends on `getModelUsageAggregates(organizationId, sinceDays)` on
`UsageService` (see `interfaces/usage-source.interface.ts`) — not implemented
yet. Same `useExisting` binding pattern as the analytics module: compiles now,
needs that method to actually return data before it's useful end-to-end.

Also imports `PRICING_TABLE` directly from
`../usage/cost-calculator/pricing-table.ts` (Vedant's file) — read-only, for
computing savings estimates. Don't modify that file from here.
