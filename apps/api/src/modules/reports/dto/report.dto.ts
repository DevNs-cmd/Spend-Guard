import { ReportFormat, ReportFrequency, ReportType } from "../entities/report.entity";

export class CreateReportDto {
  name: string;
  type?: ReportType;
  format?: ReportFormat;
  frequency?: ReportFrequency;
  dateRange?: string;
  recipients?: string[];
  filters?: Record<string, any>;
  active?: boolean;
}

export class UpdateReportDto {
  name?: string;
  type?: ReportType;
  format?: ReportFormat;
  frequency?: ReportFrequency;
  dateRange?: string;
  recipients?: string[];
  filters?: Record<string, any>;
  active?: boolean;
}

export class DashboardExportDto {
  dateRange?: string;
  by?: "provider" | "model" | "project" | "tag" | "team";
  format?: ReportFormat;
  projectId?: string;
  filters?: Record<string, any>;
}
