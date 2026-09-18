// Per-provider, per-model $/1K-token pricing.
// Keep this data-driven so new models don't require calculation logic changes.

export type ModelPricing = {
  input: number;
  output: number;
  cached?: number;
};

export const PRICING_TABLE: Record<
  string,
  Record<string, ModelPricing>
> = {
  openai: {
    "gpt-4o": {
      input: 0.0025,
      output: 0.01,
      cached: 0.00125,
    },
  },

  anthropic: {
    "claude-3-5-sonnet": {
      input: 0.003,
      output: 0.015,
      cached: 0.0003,
    },
  },
};