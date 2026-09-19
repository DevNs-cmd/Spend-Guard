import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { ReportsService } from "./reports.service";
import { CreateReportDto, UpdateReportDto, DashboardExportDto } from "./dto/report.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentOrgContext } from "@spendguard/shared-types";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async findAll(@CurrentOrg() org?: CurrentOrgContext) {
    const orgId = org?.organizationId ?? "default-org";
    return this.reportsService.findAll(orgId);
  }

  @Post()
  async schedule(
    @Body() dto: CreateReportDto,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.reportsService.create(orgId, dto);
  }

  @Get("share/:token")
  async viewShared(@Param("token") token: string) {
    return this.reportsService.getByShareToken(token);
  }

  @Get("export/dashboard")
  async exportDashboardGet(
    @Query() query: DashboardExportDto,
    @Res() res: Response,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    const exportResult = await this.reportsService.exportDashboard(orgId, query);
    res.setHeader("Content-Type", exportResult.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exportResult.filename}"`,
    );
    res.send(exportResult.buffer);
  }

  @Post("export/dashboard")
  async exportDashboardPost(
    @Body() query: DashboardExportDto,
    @Res() res: Response,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    const exportResult = await this.reportsService.exportDashboard(orgId, query);
    res.setHeader("Content-Type", exportResult.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exportResult.filename}"`,
    );
    res.send(exportResult.buffer);
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.reportsService.findById(orgId, id);
  }

  @Get(":id/export")
  async exportReport(
    @Param("id") id: string,
    @Query("format") format: "pdf" | "csv" | undefined,
    @Res() res: Response,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    const exportResult = await this.reportsService.exportReport(orgId, id, format);
    res.setHeader("Content-Type", exportResult.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exportResult.filename}"`,
    );
    res.send(exportResult.buffer);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateReportDto,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.reportsService.update(orgId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param("id") id: string,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    await this.reportsService.delete(orgId, id);
  }
}
