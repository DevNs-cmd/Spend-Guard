import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ProvidersService } from "./providers.service";
import { ConnectProviderDto } from "./dto/connect-provider.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentOrgContext } from "@spendguard/shared-types";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("providers")
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  findAll(@CurrentOrg() org: CurrentOrgContext) {
    return this.providersService.findAll(org.organizationId);
  }

  @Post()
  connect(@CurrentOrg() org: CurrentOrgContext, @Body() dto: ConnectProviderDto) {
    return this.providersService.connect(org.organizationId, dto);
  }

  @Delete(":id")
  disconnect(@CurrentOrg() org: CurrentOrgContext, @Param("id") id: string) {
    return this.providersService.disconnect(org.organizationId, id);
  }
}
