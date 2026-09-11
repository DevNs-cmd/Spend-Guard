# Krrish — Provider Connections, Analytics & Optimization

## Scope
You own:
- `apps/api/src/modules/providers/**`
- `apps/api/src/modules/analytics/**`
- `apps/api/src/modules/recommendations/**`

You read from Vedant's `usage` module through `UsageService` (never query
his tables directly), and you write incoming usage rows into his module
through `UsageService.ingest()` — don't create a parallel usage table.

## Phase 1 — Provider Connections (do this first, it's dev-priority #1/2)
- `ProviderConnection` entity: org, provider type, **encrypted** API key, active flag
- `POST /providers` (connect), `GET /providers` (list), `DELETE /providers/:id`
- One connector per provider implementing the shared `ProviderConnector`
  interface (`connectors/base.connector.ts`): OpenAI, Anthropic, Gemini —
  each `fetchUsage(since: Date)`
- `UsageSyncProcessor` — a BullMQ job that runs per connection on a schedule,
  calls the right connector, and passes results to Vedant's
  `UsageService.ingest()`
- API keys must be encrypted at rest (`PROVIDER_KEY_ENCRYPTION_SECRET` env var)
  — never log or return a decrypted key in any response

## Phase 2 — Analytics (once usage data is flowing)
- `GET /analytics/trends` — spend over time, sliceable by provider/project
- Anomaly detection (`anomaly-detection/`) — flag spend spikes vs. historical
  baseline per org/project/model
- Forecasting (`forecasting/`) — projected month-end spend given current pace
- Month-over-month comparisons

## Phase 3 — Optimization Recommendations
- `GET /recommendations` — generated suggestions:
  - cheaper-model swaps for a given use pattern
  - caching opportunities (repeated near-identical prompts)
  - prompt-optimization hints (e.g. excessive context)
  - model-routing suggestions
  - estimated savings per suggestion
- This reads Vedant's cost/usage data + your own provider/model metadata —
  it does not touch budgets or alerts (Gauri's territory)

## Dependencies
- Blocked on: Neerav's auth/org context (to scope connections per org)
- Blocks: Vedant needs your ingested usage rows to build breakdowns;
  Anuj needs `/providers`, `/analytics/trends`, `/recommendations` for the UI

## Definition of done
- [ ] All three providers (OpenAI/Anthropic/Gemini) sync real usage data on schedule
- [ ] Keys are encrypted at rest, never exposed in any API response
- [ ] Sync failures are logged and retried, not silently dropped
- [ ] Analytics/recommendations endpoints return real computed data, not stubs
