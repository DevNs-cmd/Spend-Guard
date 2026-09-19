import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { BudgetsService } from "./budgets.service";
import { CreateBudgetDto, UpdateBudgetDto } from "./dto/budget.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentOrgContext } from "@spendguard/shared-types";

@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async findAll(@CurrentOrg() org?: CurrentOrgContext) {
    const orgId = org?.organizationId ?? "default-org";
    return this.budgetsService.findAll(orgId);
  }

  @Post()
  async create(
    @Body() dto: CreateBudgetDto,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.budgetsService.create(orgId, dto);
  }

  @Get("alerts")
  async getAlerts(@CurrentOrg() org?: CurrentOrgContext) {
    const orgId = org?.organizationId ?? "default-org";
    return this.budgetsService.getAlerts(orgId);
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.budgetsService.findById(orgId, id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateBudgetDto,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.budgetsService.update(orgId, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param("id") id: string,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    await this.budgetsService.delete(orgId, id);
  }

  @Post("check")
  async triggerCheck() {
    return this.budgetsService.checkThresholds();
  }
}
