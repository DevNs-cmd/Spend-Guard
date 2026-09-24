import { ReportsService } from "./reports.service";
import { Report } from "./entities/report.entity";
import { CsvGenerator } from "./generators/csv.generator";
import { PdfGenerator } from "./generators/pdf.generator";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("ReportsService", () => {
  let service: ReportsService;
  let reportRepo: any;
  let usageService: any;
  let csvGenerator: CsvGenerator;
  let pdfGenerator: PdfGenerator;

  const mockOrgId = "org-test-999";
  const otherOrgId = "org-other-888";

  beforeEach(() => {
    const reportsStore: Report[] = [];

    reportRepo = {
      find: jest.fn(async (options) => {
        if (options?.where?.active !== undefined) {
          return reportsStore.filter((r) => r.active === options.where.active);
        }
        if (options?.where?.organizationId) {
          return reportsStore.filter((r) => r.organizationId === options.where.organizationId);
        }
        return reportsStore;
      }),
      findOne: jest.fn(async ({ where }) => {
        return (
          reportsStore.find((r) => {
            if (where.id && r.id !== where.id) return false;
            if (where.organizationId && r.organizationId !== where.organizationId) return false;
            if (where.shareToken && r.shareToken !== where.shareToken) return false;
            return true;
          }) || null
        );
      }),
      create: jest.fn((dto) => ({
        id: `report-${Date.now()}-${Math.random()}`,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest.fn(async (report) => {
        const idx = reportsStore.findIndex((r) => r.id === report.id);
        if (idx >= 0) {
          reportsStore[idx] = report;
        } else {
          reportsStore.push(report);
        }
        return report;
      }),
      remove: jest.fn(async (report) => {
        const idx = reportsStore.findIndex((r) => r.id === report.id);
        if (idx >= 0) reportsStore.splice(idx, 1);
      }),
    };

    usageService = {
      summary: jest.fn(async () => ({
        totalSpendUsd: 125.5,
        totalRequests: 250,
        totalTokens: 120000,
        avgCostPerRequestUsd: 0.502,
      })),
      breakdown: jest.fn(async (by) => [
        {
          key: "openai",
          totalSpendUsd: 100.0,
          totalRequests: 200,
          totalTokens: 90000,
          avgCostPerRequestUsd: 0.5,
        },
        {
          key: "anthropic",
          totalSpendUsd: 25.5,
          totalRequests: 50,
          totalTokens: 30000,
          avgCostPerRequestUsd: 0.51,
        },
      ]),
    };

    csvGenerator = new CsvGenerator();
    pdfGenerator = new PdfGenerator();

    service = new ReportsService(reportRepo, usageService, csvGenerator, pdfGenerator);
  });

  describe("Report Scheduling & Isolation", () => {
    it("creates a report schedule with secure share token", async () => {
      const report = await service.create(mockOrgId, {
        name: "Monthly Spend Report",
        type: "spend_summary",
        format: "pdf",
        frequency: "monthly",
        recipients: ["finance@company.com"],
      });

      expect(report.id).toBeDefined();
      expect(report.shareToken).toBeDefined();
      expect(report.shareToken.length).toBeGreaterThanOrEqual(32);
      expect(report.organizationId).toBe(mockOrgId);
    });

    it("enforces tenant isolation across organizations", async () => {
      const report = await service.create(mockOrgId, {
        name: "Private Executive Report",
      });

      const found = await service.findById(mockOrgId, report.id);
      expect(found.name).toBe("Private Executive Report");

      await expect(service.findById(otherOrgId, report.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe("Report Export & Generators", () => {
    it("generates CSV export matching UsageService calculations exactly", async () => {
      const report = await service.create(mockOrgId, {
        name: "CSV Usage Report",
        format: "csv",
      });

      const result = await service.exportReport(mockOrgId, report.id, "csv");
      expect(result.contentType).toContain("text/csv");
      const csvString = result.buffer.toString("utf-8");

      expect(csvString).toContain("Total Spend (USD),125.5000");
      expect(csvString).toContain("Total Requests,250");
      expect(csvString).toContain("Total Tokens,120000");
      expect(csvString).toContain('"openai",100.0000,200,90000,0.500000');
    });

    it("generates PDF export with valid PDF header and stream", async () => {
      const report = await service.create(mockOrgId, {
        name: "PDF Executive Report",
        format: "pdf",
      });

      const result = await service.exportReport(mockOrgId, report.id, "pdf");
      expect(result.contentType).toBe("application/pdf");
      expect(result.buffer.length).toBeGreaterThan(100);
      expect(result.buffer.slice(0, 8).toString()).toContain("%PDF-1.4");
    });

    it("supports custom dashboard view export preserving chosen dimension", async () => {
      const result = await service.exportDashboard(mockOrgId, {
        by: "model",
        format: "csv",
        dateRange: "last_30_days",
      });

      expect(usageService.breakdown).toHaveBeenCalledWith("model");
      expect(result.filename).toContain("dashboard-export-model");
    });
  });

  describe("Shareable Report Links", () => {
    it("allows public access via valid shareToken", async () => {
      const report = await service.create(mockOrgId, {
        name: "Public Shared Report",
      });

      const shared = await service.getByShareToken(report.shareToken);
      expect(shared.report.id).toBe(report.id);
      expect(shared.data.summary.totalSpendUsd).toBe(125.5);
    });

    it("rejects non-existent share tokens with 404", async () => {
      await expect(service.getByShareToken("invalid-random-token")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("Scheduled Delivery Pipeline", () => {
    it("processes active recurring reports and updates lastRunAt", async () => {
      await service.create(mockOrgId, {
        name: "Recurring Report",
        frequency: "daily",
        recipients: ["admin@spendguard.io"],
      });

      const result = await service.processScheduledReports();
      expect(result.processedCount).toBe(1);
    });
  });
});
