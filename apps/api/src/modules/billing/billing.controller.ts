// Endpoints: GET /billing/plan, POST /billing/checkout, GET /billing/portal
import { Controller, Get, Post } from "@nestjs/common";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("plan")
  plan() {
    return this.billingService.getPlan();
  }

  @Post("checkout")
  checkout() {
    return this.billingService.createCheckoutSession();
  }
}
