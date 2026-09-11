// Per-provider, per-model $/1K-tokens pricing (input/output/cached).
// Keep this data-driven so new models don't require code changes.
export const PRICING_TABLE: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.005, output: 0.015 },
  "claude-3-5-sonnet": { input: 0.003, output: 0.015 },
};
