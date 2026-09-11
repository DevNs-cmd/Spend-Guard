# Vedant — Cost Engine, Data Models & Attribution

## Scope
You own:
- `apps/api/src/modules/usage/**`
- `apps/api/src/modules/tags/**`

This is the **most depended-on module** in the whole backend — Krrish writes
into it, Gauri reads from it for budgets/reports, Anuj's frontend reads it
for every chart. Treat schema changes as high-impact: announce before merging.

## What you're building

### 1. Core data models (`usage/entities`)
- `UsageRecord` — one API call: organizationId, providerConnectionId, model,
  inputTokens, outputTokens, cachedTokens, projectId, occurredAt
- `CostRecord` — computed cost tied to a `UsageRecord` (kept separate so
  pricing changes over time don't corrupt historical cost)
- `Project` — an attribution bucket within an org

### 2. Cost calculation engine (`usage/cost-calculator`)
- `PRICING_TABLE` — per-provider, per-model $/1K-tokens (input/output/cached)
  — keep this data-driven (config or DB table), not hardcoded per feature
- `CostCalculatorService.calculate(model, inputTokens, outputTokens)` — must
  correctly handle cached-token discounts where providers offer them
- Called every time Krrish's sync workers ingest a new `UsageRecord`

### 3. Ingestion API (for Krrish's workers)
- `UsageService.ingest(rows)` — the only way usage data enters the system.
  Validates, computes cost via the calculator, persists both `UsageRecord`
  and `CostRecord`

### 4. Query/breakdown API (for everyone else)
- `GET /usage/summary` — total spend, requests, tokens, avg cost/request
- `GET /usage/breakdown?by=provider|model|project|tag|team` — the core
  attribution query everyone else's features are built on

### 5. Tagging system (`modules/tags`)
- `Tag` entity: org, key, value
- `GET /tags`, `POST /tags`, and the ability to attach tags to a `UsageRecord`
- This is what makes "breakdown by feature/team/custom tag" possible

## Dependencies
- Blocked on: Neerav's org context (all your tables are org-scoped)
- Blocks: Krrish needs `UsageService.ingest()` ready before his sync workers
  can do anything useful; Gauri needs your breakdown queries for budgets/reports;
  Anuj needs `/usage/summary` and `/usage/breakdown` for the whole dashboard

## Definition of done
- [ ] Cost calculation is verified against at least 3 real provider pricing
      examples (input/output/cached) with correct numbers
- [ ] `/usage/breakdown` correctly aggregates by every dimension (provider,
      model, project, tag) with no double-counting
- [ ] Ingestion is idempotent (re-syncing the same usage window doesn't
      duplicate records)
- [ ] Migrations are committed for every entity change, never hand-edited after merge
