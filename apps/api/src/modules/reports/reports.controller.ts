// Endpoints: GET /reports, POST /reports (schedule), GET /reports/:id/export?format=pdf|csv
import { Controller, Get, Post } from "@nestjs/common";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Post()
  schedule() {
    return this.reportsService.schedule();
  }
}
