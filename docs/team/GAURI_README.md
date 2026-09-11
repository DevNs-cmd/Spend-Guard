# Gauri — Budgets, Alerts, Reporting & Billing

## Scope
You own:
- `apps/api/src/modules/budgets/**`
- `apps/api/src/modules/reports/**`
- `apps/api/src/modules/billing/**`

You read current spend from Vedant's `usage` module (`UsageService`) — you
do not compute cost yourself, only compare it against limits/generate exports.

## Phase 1 — Budgets & Alerts (dev-priority #5)
- `Budget` entity: scope (org/project/team), soft limit, hard limit, period
- `Alert` entity: which budget fired, severity (soft/hard/forecast), timestamp
- `GET /budgets`, `POST /budgets`, `PATCH /budgets/:id`
- `BudgetsService.checkThresholds()` — run on a schedule (BullMQ) comparing
  current spend (from Vedant's summary/breakdown queries) against each budget;
  fire an `Alert` when crossed
- Notification fan-out (`budgets/alerts/notifiers/`): email, Slack, in-app —
  respect each org's configured channels
- Forecast alerts: use Krrish's forecast output to warn *before* a hard limit
  is hit, not just after

## Phase 2 — Reporting (dev-priority #8)
- `GET /reports`, `POST /reports` (schedule a recurring report)
- Generators: PDF (`generators/pdf.generator.ts`) and CSV
  (`generators/csv.generator.ts`) — both pull from Vedant's breakdown queries
- Scheduled email delivery + shareable report links
- Custom dashboard export (whatever view the user is looking at, exportable)

## Phase 3 — Billing (dev-priority #9, last)
- Stripe integration (`billing/stripe/stripe.service.ts`)
- `GET /billing/plan`, `POST /billing/checkout`, Stripe customer portal link
- `StripeWebhookController` (`billing/stripe/webhook.controller.ts`) —
  verify signatures, keep subscription state in sync
- Enforce plan-based limits (provider connections, projects, seats, retention)
  using the tiers from the project brief (Starter/Growth/Pro/Enterprise) —
  coordinate with Neerav since limits gate org-level actions

## Dependencies
- Blocked on: Vedant's usage/cost queries (for budget checks and reports),
  Krrish's forecast output (for forecast alerts)
- Blocks: Anuj needs `/budgets`, `/reports`, `/billing/*` for the corresponding pages

## Definition of done
- [ ] Budget threshold checks run reliably on schedule and fire exactly one
      alert per breach (no duplicate spam)
- [ ] At least email + Slack notification channels work end-to-end
- [ ] PDF and CSV report exports contain accurate numbers matching the dashboard
- [ ] Stripe checkout + webhook flow correctly updates an org's plan and enforces its limits
