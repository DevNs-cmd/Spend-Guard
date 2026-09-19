// Endpoints:
// GET /usage/summary
// GET /usage/breakdown?by=provider|model|project|tag|team

import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from "@nestjs/common";

import { UsageService } from "./usage.service";

@Controller("usage")
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get("summary")
  async summary() {
    return this.usageService.summary();
  }

  @Get("breakdown")
  breakdown(
    @Query("by")
    by:
      | "provider"
      | "model"
      | "project"
      | "tag"
      | "team" = "provider",
  ) {
    const allowed = [
      "provider",
      "model",
      "project",
      "tag",
      "team",
    ];

    if (!allowed.includes(by)) {
      throw new BadRequestException(
        "by must be one of: provider, model, project, tag, team",
      );
    }

    return this.usageService.breakdown(by);
  }
}