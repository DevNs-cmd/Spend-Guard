# Architecture Overview

```
┌────────────┐      HTTPS       ┌──────────────┐      SQL      ┌────────────┐
│  apps/web   │ ───────────────▶ │   apps/api    │ ────────────▶ │ PostgreSQL │
│  (Next.js)  │ ◀─────────────── │   (NestJS)    │                └────────────┘
└────────────┘      JSON        └──────┬───────┘
                                        │ jobs
                                        ▼
                                 ┌──────────────┐      calls      ┌───────────────┐
                                 │  BullMQ/Redis │ ───────────────▶ │ OpenAI/Anthropic/│
                                 │   workers     │                 │ Gemini APIs      │
                                 └──────────────┘                 └───────────────┘
```

- **apps/web** never talks to the database or provider APIs directly — only to `apps/api`.
- **apps/api** is organized as one NestJS module per feature area (see module
  ownership table in the root README). Each module owns its own entities and
  only exposes data to other modules through its service class, not raw
  repository access.
- **Workers** (BullMQ) handle anything that takes more than a request/response
  cycle: provider usage sync, report generation, scheduled alert checks.
- **Multi-tenancy**: every table with tenant data has an `organizationId`
  column; every query is scoped by the authenticated org from `@CurrentOrg()`.
  No cross-org data access, ever — this is a hard requirement, not a nice-to-have.
