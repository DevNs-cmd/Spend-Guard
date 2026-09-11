# apps/api — Backend (NestJS)

Modules are split by owner. **Only edit files inside your own module folder**
(`src/modules/<your-modules>/**`). Shared infra below is edited via PR only:

- `src/app.module.ts` — module registry (add your module import here via PR)
- `src/common/**` — shared guards/decorators/filters/interceptors
- `src/config/**`, `src/database/**` — shared config & migrations

## Module Ownership
| Module            | Owner  |
|-------------------|--------|
| auth              | Neerav |
| organizations     | Neerav |
| providers         | Krrish |
| analytics         | Krrish |
| recommendations   | Krrish |
| usage             | Vedant |
| tags              | Vedant |
| budgets           | Gauri  |
| reports           | Gauri  |
| billing           | Gauri  |

Each module has its own `README.md` with the exact task breakdown — read it
before writing code in that folder.

## Conventions
- Every module: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `entities/`
- All DB access via TypeORM (or Prisma — pick one project-wide, don't mix)
- All endpoints require an authenticated request with org context (`@CurrentOrg()`
  decorator from `src/common/decorators`) — multi-tenant isolation is mandatory,
  not optional
- Long-running work (provider sync, report generation) goes through BullMQ
  workers, never inline in a request handler
- New shared DTOs go in `packages/shared-types`, not duplicated locally
