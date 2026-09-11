import { PRICING_TABLE } from "./pricing-table";

export class CostCalculatorService {
  calculate(model: string, inputTokens: number, outputTokens: number): number {
    const price = PRICING_TABLE[model];
    if (!price) return 0;
    return (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output;
  }
}
