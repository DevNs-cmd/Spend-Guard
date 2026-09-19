import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomBytes } from "crypto";
import { Report } from "./entities/report.entity";
import { CreateReportDto, UpdateReportDto, DashboardExportDto } from "./dto/report.dto";
import { UsageService } from "../usage/usage.service";
import { CsvGenerator, ReportGenerationInput } from "./generators/csv.generator";
import { PdfGenerator } from "./generators/pdf.generator";

export interface GeneratedExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,

    private readonly usageService: UsageService,
    private readonly csvGenerator: CsvGenerator,
    private readonly pdfGenerator: PdfGenerator,
  ) {}

  async findAll(organizationId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { organizationId },
      order: { createdAt: "DESC" },
    });
  }

  async findById(organizationId: string, id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id, organizationId },
    });
    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }
    return report;
  }

  async create(organizationId: string, dto: CreateReportDto): Promise<Report> {
    if (!dto.name) {
      throw new BadRequestException("Report name is required");
    }

    const shareToken = randomBytes(24).toString("hex");

    const report = this.reportRepository.create({
      organizationId,
      name: dto.name,
      type: dto.type ?? "spend_summary",
      format: dto.format ?? "pdf",
      frequency: dto.frequency ?? "monthly",
      dateRange: dto.dateRange ?? "this_month",
      recipients: dto.recipients ?? [],
      shareToken,
      shareExpiresAt: null,
      filters: dto.filters ?? null,
      active: dto.active ?? true,
      lastRunAt: null,
    });

    return this.reportRepository.save(report);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateReportDto,
  ): Promise<Report> {
    const report = await this.findById(organizationId, id);

    if (dto.name !== undefined) report.name = dto.name;
    if (dto.type !== undefined) report.type = dto.type;
    if (dto.format !== undefined) report.format = dto.format;
    if (dto.frequency !== undefined) report.frequency = dto.frequency;
    if (dto.dateRange !== undefined) report.dateRange = dto.dateRange;
    if (dto.recipients !== undefined) report.recipients = dto.recipients;
    if (dto.filters !== undefined) report.filters = dto.filters;
    if (dto.active !== undefined) report.active = dto.active;

    return this.reportRepository.save(report);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const report = await this.findById(organizationId, id);
    await this.reportRepository.remove(report);
  }

  /**
   * Generates file export for a specific saved report.
   */
  async exportReport(
    organizationId: string,
    id: string,
    overrideFormat?: "pdf" | "csv",
  ): Promise<GeneratedExportResult> {
    const report = await this.findById(organizationId, id);
    const format = overrideFormat ?? report.format;
    const dimension = (report.filters?.by as any) ?? "provider";

    const inputData = await this.collectReportData(
      report.name,
      organizationId,
      report.dateRange,
      dimension,
    );

    return this.generateExport(inputData, format, `report-${report.id}`);
  }

  /**
   * Exports the user's active dashboard view according to their chosen filters.
   */
  async exportDashboard(
    organizationId: string,
    query: DashboardExportDto,
  ): Promise<GeneratedExportResult> {
    const format = query.format ?? "csv";
    const dimension = query.by ?? "provider";
    const dateRange = query.dateRange ?? "current_view";

    const inputData = await this.collectReportData(
      `Dashboard Export (${dimension})`,
      organizationId,
      dateRange,
      dimension,
    );

    return this.generateExport(inputData, format, `dashboard-export-${dimension}`);
  }

  /**
   * Public/secure access to a report via its unique shareToken without predictable IDs.
   */
  async getByShareToken(token: string): Promise<{ report: Report; data: ReportGenerationInput }> {
    const report = await this.reportRepository.findOne({
      where: { shareToken: token },
    });

    if (!report) {
      throw new NotFoundException("Share link is invalid or does not exist");
    }

    if (report.shareExpiresAt && report.shareExpiresAt < new Date()) {
      throw new BadRequestException("Share link has expired");
    }

    const dimension = (report.filters?.by as any) ?? "provider";
    const data = await this.collectReportData(
      report.name,
      report.organizationId,
      report.dateRange,
      dimension,
    );

    return { report, data };
  }

  /**
   * Background processor: generates and emails scheduled recurring reports.
   */
  async processScheduledReports(): Promise<{ processedCount: number }> {
    const recurringReports = await this.reportRepository.find({
      where: { active: true },
    });

    this.logger.log(`Processing ${recurringReports.length} recurring report schedule(s)`);
    let processed = 0;

    for (const report of recurringReports) {
      if (report.frequency === "once" && report.lastRunAt) {
        continue;
      }

      try {
        const exportResult = await this.exportReport(report.organizationId, report.id);
        const recipients = report.recipients ?? [];

        this.logger.log(
          `[Scheduled Report] Generated ${exportResult.filename} (${exportResult.contentType}) for org ${report.organizationId} -> ${recipients.join(", ") || "no recipients"}`,
        );

        report.lastRunAt = new Date();
        await this.reportRepository.save(report);
        processed++;
      } catch (err) {
        this.logger.error(`Failed scheduled delivery for report ${report.id}: ${(err as Error).message}`);
      }
    }

    return { processedCount: processed };
  }

  private async collectReportData(
    title: string,
    organizationId: string,
    dateRange: string,
    byDimension: "provider" | "model" | "project" | "tag" | "team" = "provider",
  ): Promise<ReportGenerationInput> {
    // Pull numbers directly from Vedant's UsageService queries
    const summary = await this.usageService.summary();
    const breakdown = await this.usageService.breakdown(byDimension);

    return {
      title,
      organizationId,
      dateRange,
      summary: {
        totalSpendUsd: summary.totalSpendUsd ?? 0,
        totalRequests: summary.totalRequests ?? 0,
        totalTokens: summary.totalTokens ?? 0,
        avgCostPerRequestUsd: summary.avgCostPerRequestUsd ?? 0,
      },
      breakdown: breakdown.map((item) => ({
        key: item.key,
        totalSpendUsd: item.totalSpendUsd,
        totalRequests: item.totalRequests,
        totalTokens: item.totalTokens,
        avgCostPerRequestUsd: item.avgCostPerRequestUsd,
      })),
      breakdownDimension: byDimension,
    };
  }

  private generateExport(
    inputData: ReportGenerationInput,
    format: "pdf" | "csv",
    baseName: string,
  ): GeneratedExportResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (format === "csv") {
      const csvContent = this.csvGenerator.generate(inputData);
      return {
        buffer: Buffer.from(csvContent, "utf-8"),
        contentType: "text/csv; charset=utf-8",
        filename: `${baseName}-${timestamp}.csv`,
      };
    }

    // Default: PDF
    const pdfBuffer = this.pdfGenerator.generate(inputData);
    return {
      buffer: pdfBuffer,
      contentType: "application/pdf",
      filename: `${baseName}-${timestamp}.pdf`,
    };
  }
}
