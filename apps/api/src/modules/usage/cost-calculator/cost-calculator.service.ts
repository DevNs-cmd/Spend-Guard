import { Injectable } from "@nestjs/common";
import { PRICING_TABLE } from "./pricing-table";
@Injectable()
export class CostCalculatorService {
  calculate(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    cachedTokens = 0,
  ): number {
    const providerPricing = PRICING_TABLE[provider];

    if (!providerPricing) {
      throw new Error(
        `No pricing configured for provider: ${provider}`,
      );
    }

    const price = providerPricing[model];

    if (!price) {
      throw new Error(
        `No pricing configured for model: ${provider}/${model}`,
      );
    }

    if (inputTokens < 0 || outputTokens < 0 || cachedTokens < 0) {
      throw new Error("Token counts cannot be negative");
    }

    if (cachedTokens > inputTokens) {
      throw new Error("Cached tokens cannot exceed input tokens");
    }

    const regularInputTokens = inputTokens - cachedTokens;

    const inputCost =
      (regularInputTokens / 1000) * price.input;

    const cachedCost = price.cached
      ? (cachedTokens / 1000) * price.cached
      : (cachedTokens / 1000) * price.input;

    const outputCost =
      (outputTokens / 1000) * price.output;

    return inputCost + cachedCost + outputCost;
  }
}