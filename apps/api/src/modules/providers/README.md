# modules/providers — Owner: Krrish

Full task detail: `/docs/team/KRRISH_README.md`.

## What's implemented here
- `ProviderConnection` entity with encrypted credentials + sync tracking fields
- AES-256-GCM encryption (`utils/crypto.util.ts`) — needs `PROVIDER_KEY_ENCRYPTION_SECRET` in `.env`
- Connectors for OpenAI, Anthropic, and Gemini (`connectors/`), each implementing
  the shared `ProviderConnector` interface — see each file's header comment
  for the real API/setup it depends on (OpenAI + Anthropic call their admin
  usage APIs directly; Gemini queries Cloud Billing Export via BigQuery since
  Google has no equivalent per-key usage REST endpoint)
- `ConnectorFactory` — maps a `Provider` + decrypted credentials to the right connector
- `ProvidersService` — CRUD + encryption/decryption, called by both the controller and the sync worker
- `ProvidersController` — `GET/POST /providers`, `DELETE /providers/:id`
- BullMQ sync pipeline (`workers/`): `UsageSyncScheduler` enqueues one job per
  active connection every 15 minutes; `UsageSyncProcessor` fetches usage since
  the last successful sync and calls `UsageService.ingest()`

## Known integration point
`UsageSyncProcessor` calls `this.usageService.ingest(rows)` — this already
matches Vedant's current `ingest(rows: unknown[])` stub signature, so it
compiles and will work as soon as `ingest()` actually persists rows.

## Setup needed before this runs against real data
- `.env`: `PROVIDER_KEY_ENCRYPTION_SECRET`, `REDIS_HOST`/`REDIS_PORT`
- OpenAI: an **Admin** API key (`sk-admin-...`), not a regular project key
- Anthropic: an **Admin** API key (`sk-ant-admin-...`), provisioned by an org admin
- Gemini: Cloud Billing Export to BigQuery enabled on the org's billing
  account, plus a service account with BigQuery Data Viewer + Job User on
  that dataset
