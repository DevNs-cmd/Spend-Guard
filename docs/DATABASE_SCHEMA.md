# Database Schema (high level)

| Entity              | Owner  | Key fields                                            |
|---------------------|--------|--------------------------------------------------------|
| Organization         | Neerav | id, name, plan                                         |
| Membership            | Neerav | id, userId, organizationId, role                       |
| ProviderConnection     | Krrish | id, organizationId, provider, encryptedApiKey, active   |
| UsageRecord           | Vedant | id, organizationId, providerConnectionId, model, tokens, projectId, occurredAt |
| CostRecord            | Vedant | id, usageRecordId, costUsd                             |
| Project               | Vedant | id, organizationId, name                                |
| Tag                   | Vedant | id, organizationId, key, value                          |
| Budget                | Gauri  | id, organizationId, projectId, softLimitUsd, hardLimitUsd |
| Alert                 | Gauri  | id, organizationId, budgetId, severity, firedAt          |

All migrations live in `apps/api/src/database/migrations/`. Generate with
TypeORM's migration CLI — never hand-edit a committed migration; add a new one.
