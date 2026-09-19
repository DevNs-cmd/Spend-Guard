import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from "@nestjs/common";
import { BillingService } from "./billing.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentOrgContext } from "@spendguard/shared-types";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("plan")
  async getPlan(@CurrentOrg() org?: CurrentOrgContext) {
    const orgId = org?.organizationId ?? "default-org";
    return this.billingService.getPlan(orgId);
  }

  @Post("checkout")
  async createCheckout(
    @Body("plan") plan: string,
    @Body("returnUrl") returnUrl?: string,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.billingService.createCheckoutSession(orgId, plan, undefined, returnUrl);
  }

  @Get("portal")
  async getPortalGet(
    @Query("returnUrl") returnUrl?: string,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.billingService.createCustomerPortalSession(orgId, returnUrl);
  }

  @Post("portal")
  async getPortalPost(
    @Body("returnUrl") returnUrl?: string,
    @CurrentOrg() org?: CurrentOrgContext,
  ) {
    const orgId = org?.organizationId ?? "default-org";
    return this.billingService.createCustomerPortalSession(orgId, returnUrl);
  }
}
