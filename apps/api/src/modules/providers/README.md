# modules/providers — Owner: Krrish

See `/docs/team/KRRISH_README.md`. Owns provider connections (OpenAI,
Anthropic, Gemini, ...), encrypted key storage, and the BullMQ workers that
sync usage from each provider into `usage.usage_records` (Vedant's table —
write via `UsageService`, never insert directly into that table from here).
