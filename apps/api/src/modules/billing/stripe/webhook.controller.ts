import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { StripeService } from "./stripe.service";
import { BillingService } from "../billing.service";

@Controller("billing/webhook")
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly billingService: BillingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Req() req: Request,
    @Headers("stripe-signature") signature: string,
    @Body() body: any,
  ) {
    if (!signature && !body?.type) {
      throw new BadRequestException("Missing stripe-signature header or webhook payload");
    }

    let event: any;
    try {
      const rawBody = (req as any).rawBody || req.body;
      event = this.stripeService.constructEvent(
        rawBody ? (typeof rawBody === "string" || Buffer.isBuffer(rawBody) ? rawBody : JSON.stringify(rawBody)) : JSON.stringify(body),
        signature || "dev_sig",
      );
    } catch (err) {
      throw new BadRequestException(`Stripe webhook signature verification failed: ${(err as Error).message}`);
    }

    const result = await this.billingService.handleWebhookEvent(event);
    return { received: true, ...result };
  }
}
