# SpendGuard — AI API Cost Tracker & Spend Control Platform

Multi-tenant B2B SaaS that connects to AI providers (OpenAI, Anthropic, Gemini, etc.),
tracks usage/cost in real time, and gives teams budgets, alerts, analytics,
optimization recommendations, reporting, and billing.

## Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** NestJS
- **Database:** PostgreSQL + Redis
- **Queue/Workers:** BullMQ
- **Auth:** Clerk or Auth0 (Organizations)
- **Payments:** Stripe
- **Storage:** S3-compatible (AWS S3 / R2)
- **Infra:** Docker + Kubernetes / managed platform

## Repo Layout

```
spendguard/
├── apps/
│   ├── web/          # Next.js frontend — owned by ANUJ
│   └── api/           # NestJS backend — modules split by owner (see below)
├── packages/
│   └── shared-types/   # TS types/DTOs shared between web and api
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   ├── DATABASE_SCHEMA.md
│   ├── GIT_WORKFLOW.md
│   └── team/            # One detailed README per team member
├── .github/workflows/    # CI
├── docker-compose.yml
└── .env.example
```

## Team & Module Ownership

| Person  | Owns                                                                 |
|---------|-----------------------------------------------------------------------|
| Anuj    | `apps/web/**` — entire frontend                                       |
| Neerav  | `apps/api/src/modules/auth/**`, `apps/api/src/modules/organizations/**` |
| Krrish  | `apps/api/src/modules/providers/**`, `apps/api/src/modules/analytics/**`, `apps/api/src/modules/recommendations/**` |
| Vedant  | `apps/api/src/modules/usage/**`, `apps/api/src/modules/tags/**`         |
| Gauri   | `apps/api/src/modules/budgets/**`, `apps/api/src/modules/reports/**`, `apps/api/src/modules/billing/**` |

**Rule: only edit files inside your own module folder(s).** Shared files
(`apps/api/src/common/**`, `apps/api/src/app.module.ts`, `packages/shared-types/**`,
`docker-compose.yml`) are edited only via PR + review, never pushed to directly —
see `docs/GIT_WORKFLOW.md`.

Full task breakdown for each person is in `docs/team/<NAME>_README.md`.
Read yours before writing any code.

## Development Priority Order (strict — do not skip ahead)
1. Auth + Organizations + basic Provider connection (Neerav, Krrish)
2. Usage & cost data sync + storage (Krrish, Vedant)
3. Core cost dashboard + breakdowns (Anuj, Vedant)
4. Tagging & attribution system (Vedant)
5. Budgets & alerts (Gauri)
6. Trends & basic analytics (Krrish)
7. Optimization recommendations (Krrish)
8. Reporting + Slack/email notifications (Gauri)
9. Billing (Gauri)

## Getting Started
```bash
cp .env.example .env
docker compose up -d          # postgres + redis
cd apps/api && npm install && npm run start:dev
cd apps/web && npm install && npm run dev
```

## Deadline
**20 September** — strict, no extensions. Real production project: no unfinished
features, no unhandled errors, clean/secure/scalable code, light purple theme on the UI.
