# API Contracts (living document)

Update this whenever you add/change an endpoint your module exposes to
others (especially the frontend). Keep it accurate — Anuj builds against
this, not against your source code directly.

| Method | Path                        | Owner  | Purpose                              |
|--------|-----------------------------|--------|---------------------------------------|
| POST   | /auth/login                 | Neerav | Start session                        |
| GET    | /auth/session                | Neerav | Current user/org session             |
| POST   | /organizations               | Neerav | Create org                           |
| POST   | /organizations/:id/members    | Neerav | Invite/add member                    |
| GET    | /providers                   | Krrish | List connected providers             |
| POST   | /providers                   | Krrish | Connect a provider                   |
| DELETE | /providers/:id                | Krrish | Disconnect a provider                |
| GET    | /usage/summary                | Vedant | Overview KPIs                        |
| GET    | /usage/breakdown               | Vedant | Breakdown by provider/model/tag/etc. |
| GET    | /tags                         | Vedant | List tags                            |
| POST   | /tags                         | Vedant | Create tag                           |
| GET    | /budgets                      | Gauri  | List budgets                         |
| POST   | /budgets                      | Gauri  | Create budget                        |
| GET    | /analytics/trends              | Krrish | Spend trend series                   |
| GET    | /recommendations               | Krrish | Optimization suggestions             |
| GET    | /reports                      | Gauri  | List reports                         |
| POST   | /reports                      | Gauri  | Schedule a report                    |
| GET    | /billing/plan                  | Gauri  | Current plan/usage metering          |
| POST   | /billing/checkout               | Gauri  | Stripe checkout session              |
