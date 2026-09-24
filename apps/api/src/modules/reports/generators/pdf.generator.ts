import { Injectable } from "@nestjs/common";
import { ReportGenerationInput } from "./csv.generator";

@Injectable()
export class PdfGenerator {
  generate(input: ReportGenerationInput): Buffer {
    // Generate valid PDF document conforming to standard PDF-1.4 specifications
    const lines: string[] = [];

    lines.push("%PDF-1.4");
    lines.push("%âãÏÓ");

    const contentStream = this.buildContentStream(input);
    const streamLength = Buffer.byteLength(contentStream, "utf-8");

    const objects: string[] = [];

    // Object 1: Catalog
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

    // Object 2: Pages
    objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");

    // Object 3: Page
    objects.push(
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj",
    );

    // Object 4: Font Standard (Helvetica)
    objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");

    // Object 5: Font Bold (Helvetica-Bold)
    objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj");

    // Object 6: Stream
    objects.push(
      `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`,
    );

    let offset = 0;
    const xrefOffsets: number[] = [0];

    let pdfBody = "%PDF-1.4\n";
    offset = Buffer.byteLength(pdfBody, "utf-8");

    for (let i = 0; i < objects.length; i++) {
      xrefOffsets.push(offset);
      const objStr = objects[i] + "\n";
      pdfBody += objStr;
      offset += Buffer.byteLength(objStr, "utf-8");
    }

    const startXref = offset;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      xref += `${String(xrefOffsets[i]).padStart(10, "0")} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(pdfBody + xref + trailer, "utf-8");
  }

  private buildContentStream(input: ReportGenerationInput): string {
    const commands: string[] = [];

    // Header banner bar (Purple brand background)
    commands.push("0.4 0.2 0.8 rg"); // Purple fill
    commands.push("36 720 540 40 re");
    commands.push("f");

    // Title in Header
    commands.push("BT");
    commands.push("/F2 18 Tf");
    commands.push("1 1 1 rg"); // White text
    commands.push("48 735 Td");
    commands.push(`(${this.escapePdf(input.title)}) Tj`);
    commands.push("ET");

    // Metadata section
    commands.push("BT");
    commands.push("/F1 10 Tf");
    commands.push("0.2 0.2 0.2 rg"); // Dark grey text
    commands.push("36 695 Td");
    commands.push(`(Organization: ${this.escapePdf(input.organizationId)}) Tj`);
    commands.push("0 -15 Td");
    commands.push(`(Date Range: ${this.escapePdf(input.dateRange)}) Tj`);
    commands.push("0 -15 Td");
    commands.push(`(Generated: ${this.escapePdf(new Date().toISOString().replace("T", " ").substring(0, 19))}) Tj`);
    commands.push("ET");

    // Divider Line
    commands.push("0.7 0.7 0.7 RG");
    commands.push("1 w");
    commands.push("36 645 m 576 645 l S");

    // Executive Summary KPI Box
    commands.push("0.95 0.95 0.98 rg");
    commands.push("36 575 540 55 re");
    commands.push("f");

    commands.push("BT");
    commands.push("/F2 12 Tf");
    commands.push("0.1 0.1 0.2 rg");
    commands.push("48 610 Td");
    commands.push("(EXECUTIVE SUMMARY) Tj");
    commands.push("ET");

    commands.push("BT");
    commands.push("/F1 10 Tf");
    commands.push("0.2 0.2 0.2 rg");
    commands.push("48 588 Td");
    commands.push(
      `(Total Spend: $${input.summary.totalSpendUsd.toFixed(2)}    |    Requests: ${input.summary.totalRequests}    |    Tokens: ${input.summary.totalTokens}    |    Avg Cost: $${input.summary.avgCostPerRequestUsd.toFixed(4)}) Tj`,
    );
    commands.push("ET");

    // Breakdown Section Header
    const dim = input.breakdownDimension ?? "Category";
    commands.push("BT");
    commands.push("/F2 12 Tf");
    commands.push("0.1 0.1 0.2 rg");
    commands.push("36 545 Td");
    commands.push(`(SPEND BREAKDOWN BY ${this.escapePdf(dim.toUpperCase())}) Tj`);
    commands.push("ET");

    // Table Header
    commands.push("0.9 0.9 0.95 rg");
    commands.push("36 520 540 18 re f");

    commands.push("BT");
    commands.push("/F2 9 Tf");
    commands.push("0.1 0.1 0.2 rg");
    commands.push("40 525 Td");
    commands.push(`(${this.escapePdf(dim.toUpperCase())}) Tj`);
    commands.push("200 0 Td");
    commands.push("(SPEND USD) Tj");
    commands.push("90 0 Td");
    commands.push("(REQUESTS) Tj");
    commands.push("90 0 Td");
    commands.push("(TOKENS) Tj");
    commands.push("80 0 Td");
    commands.push("(AVG COST) Tj");
    commands.push("ET");

    // Table Rows
    let currentY = 500;
    const maxItems = Math.min(input.breakdown.length, 18);

    for (let i = 0; i < maxItems; i++) {
      const item = input.breakdown[i];
      if (i % 2 === 1) {
        commands.push(`0.98 0.98 0.99 rg 36 ${currentY - 3} 540 15 re f`);
      }

      commands.push("BT");
      commands.push("/F1 9 Tf");
      commands.push("0.2 0.2 0.2 rg");
      commands.push(`40 ${currentY} Td`);
      commands.push(`(${this.escapePdf(item.key.substring(0, 32))}) Tj`);
      commands.push(`200 0 Td`);
      commands.push(`($${item.totalSpendUsd.toFixed(2)}) Tj`);
      commands.push(`90 0 Td`);
      commands.push(`(${item.totalRequests}) Tj`);
      commands.push(`90 0 Td`);
      commands.push(`(${item.totalTokens}) Tj`);
      commands.push(`80 0 Td`);
      commands.push(`($${item.avgCostPerRequestUsd.toFixed(4)}) Tj`);
      commands.push("ET");

      currentY -= 16;
    }

    if (input.breakdown.length === 0) {
      commands.push("BT");
      commands.push("/F1 9 Tf");
      commands.push("0.5 0.5 0.5 rg");
      commands.push("40 500 Td");
      commands.push("(No usage data found for this period.) Tj");
      commands.push("ET");
    }

    // Footer
    commands.push("0.7 0.7 0.7 RG");
    commands.push("0.5 w");
    commands.push("36 50 m 576 50 l S");

    commands.push("BT");
    commands.push("/F1 8 Tf");
    commands.push("0.5 0.5 0.5 rg");
    commands.push("36 38 Td");
    commands.push("(SpendGuard Automated Analytics - Confidential) Tj");
    commands.push("400 0 Td");
    commands.push("(Page 1 of 1) Tj");
    commands.push("ET");

    return commands.join("\n");
  }

  private escapePdf(str: string): string {
    if (!str) return "";
    return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }
}
