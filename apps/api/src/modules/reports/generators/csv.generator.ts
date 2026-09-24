import { Injectable } from "@nestjs/common";

export interface ReportGenerationInput {
  title: string;
  organizationId: string;
  dateRange: string;
  summary: {
    totalSpendUsd: number;
    totalRequests: number;
    totalTokens: number;
    avgCostPerRequestUsd: number;
  };
  breakdown: Array<{
    key: string;
    totalSpendUsd: number;
    totalRequests: number;
    totalTokens: number;
    avgCostPerRequestUsd: number;
  }>;
  breakdownDimension?: string;
}

@Injectable()
export class CsvGenerator {
  generate(input: ReportGenerationInput): string {
    const lines: string[] = [];

    // Header metadata
    lines.push(`"SpendGuard Report: ${this.escapeCsv(input.title)}"`);
    lines.push(`"Organization ID: ${this.escapeCsv(input.organizationId)}"`);
    lines.push(`"Date Range: ${this.escapeCsv(input.dateRange)}"`);
    lines.push(`"Generated At: ${new Date().toISOString()}"`);
    lines.push("");

    // Summary Section
    lines.push("--- SUMMARY ---");
    lines.push("Metric,Value");
    lines.push(`Total Spend (USD),${input.summary.totalSpendUsd.toFixed(4)}`);
    lines.push(`Total Requests,${input.summary.totalRequests}`);
    lines.push(`Total Tokens,${input.summary.totalTokens}`);
    lines.push(`Avg Cost per Request (USD),${input.summary.avgCostPerRequestUsd.toFixed(6)}`);
    lines.push("");

    // Breakdown Section
    const dimensionName = input.breakdownDimension ?? "Category / Dimension";
    lines.push(`--- BREAKDOWN BY ${dimensionName.toUpperCase()} ---`);
    lines.push(`"${this.escapeCsv(dimensionName)}",Spend (USD),Requests,Tokens,Avg Cost per Request (USD)`);

    for (const item of input.breakdown) {
      lines.push(
        `"${this.escapeCsv(item.key)}",${item.totalSpendUsd.toFixed(4)},${item.totalRequests},${item.totalTokens},${item.avgCostPerRequestUsd.toFixed(6)}`,
      );
    }

    return lines.join("\n");
  }

  private escapeCsv(value: string): string {
    if (!value) return "";
    return value.replace(/"/g, '""');
  }
}
