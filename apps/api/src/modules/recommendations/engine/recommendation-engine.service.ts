import { Injectable } from "@nestjs/common";
import { PRICING_TABLE } from "../../usage/cost-calculator/pricing-table";
import { ModelUsageAggregate } from "../interfaces/usage-source.interface";

export type RecommendationType =
  | "cheaper_model"
  | "caching_opportunity"
  | "prompt_optimization"
  | "model_routing";

export interface Recommendation {
  type: RecommendationType;
  model: string;
  message: string;
  estimatedSavingsUsd: number | null;
}

// Suggested cheaper alternative per "premium" model. Kept here (not in
// Vedant's pricing table) since this is Krrish's own recommendation logic,
// not a source of truth for pricing.
const CHEAPER_ALTERNATIVES: Record<string, string> = {
  "gpt-4o": "gpt-4o-mini",
  "claude-3-5-sonnet": "claude-3-5-haiku",
};

const PROMPT_BLOAT_TOKEN_THRESHOLD = 4000;
const HIGH_VOLUME_REQUEST_THRESHOLD = 500;
const SMALL_TASK_TOKEN_THRESHOLD = 300;

@Injectable()
export class RecommendationEngineService {
  generate(aggregates: ModelUsageAggregate[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const agg of aggregates) {
      recommendations.push(...this.checkCheaperModel(agg));
      recommendations.push(...this.checkCaching(agg));
      recommendations.push(...this.checkPromptBloat(agg));
    }

    return recommendations;
  }

  private checkCheaperModel(agg: ModelUsageAggregate): Recommendation[] {
    const alternative = CHEAPER_ALTERNATIVES[agg.model];
    if (!alternative) return [];

    // Only suggest switching for lightweight, high-volume calls — not every
    // use of a premium model is a good candidate for downgrading.
    if (agg.avgInputTokensPerRequest > SMALL_TASK_TOKEN_THRESHOLD) return [];

    const currentPricing = PRICING_TABLE[agg.model];
    const altPricing = PRICING_TABLE[alternative];

    let estimatedSavingsUsd: number | null = null;
    if (currentPricing && altPricing) {
      const currentCostPer1k =
        (currentPricing.input + currentPricing.output) / 2; // rough blended rate
      const altCostPer1k = (altPricing.input + altPricing.output) / 2;
      const totalKTokens = (agg.inputTokens + agg.outputTokens) / 1000;
      estimatedSavingsUsd =
        Math.round((currentCostPer1k - altCostPer1k) * totalKTokens * 100) / 100;
      if (estimatedSavingsUsd <= 0) return [];
    }

    return [
      {
        type: "cheaper_model",
        model: agg.model,
        message: `Requests to ${agg.model} average only ${Math.round(agg.avgInputTokensPerRequest)} input tokens — consider routing these to ${alternative} for simple/lightweight tasks.`,
        estimatedSavingsUsd,
      },
    ];
  }

  private checkCaching(agg: ModelUsageAggregate): Recommendation[] {
    if (agg.requestCount < HIGH_VOLUME_REQUEST_THRESHOLD) return [];

    return [
      {
        type: "caching_opportunity",
        model: agg.model,
        message: `${agg.model} received ${agg.requestCount} requests recently. If many share similar prompts/context, response caching could cut redundant calls significantly.`,
        estimatedSavingsUsd: null, // depends on actual duplicate-prompt rate, not estimable from aggregates alone
      },
    ];
  }

  private checkPromptBloat(agg: ModelUsageAggregate): Recommendation[] {
    if (agg.avgInputTokensPerRequest < PROMPT_BLOAT_TOKEN_THRESHOLD) return [];

    return [
      {
        type: "prompt_optimization",
        model: agg.model,
        message: `Average input to ${agg.model} is ${Math.round(agg.avgInputTokensPerRequest)} tokens/request — review context/prompt length for trimming opportunities.`,
        estimatedSavingsUsd: null,
      },
    ];
  }
}
