import { Controller, Get, UseGuards } from "@nestjs/common";
import { RecommendationsService } from "./recommendations.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentOrgContext } from "@spendguard/shared-types";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("recommendations")
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  findAll(@CurrentOrg() org: CurrentOrgContext) {
    return this.recommendationsService.generate(org.organizationId);
  }
}
