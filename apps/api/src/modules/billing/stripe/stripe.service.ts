import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import Stripe from "stripe";

export interface CreateCheckoutParams {
  organizationId: string;
  plan: string;
  customerEmail?: string;
  returnUrl?: string;
}

export interface CreatePortalParams {
  customerId: string;
  returnUrl?: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripeClient: Stripe | null;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (apiKey) {
      this.stripeClient = new Stripe(apiKey, {
        apiVersion: "2023-10-16" as any,
      });
    } else {
      this.stripeClient = null;
      this.logger.warn("STRIPE_SECRET_KEY is not set. StripeService will operate in test/simulation mode.");
    }
  }

  async createCheckoutSession(params: CreateCheckoutParams): Promise<{ url: string; sessionId: string }> {
    const { organizationId, plan, customerEmail, returnUrl } = params;
    const baseUrl = returnUrl ?? process.env.APP_BASE_URL ?? "http://localhost:3000";

    if (this.stripeClient) {
      try {
        const session = await this.stripeClient.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          customer_email: customerEmail,
          client_reference_id: organizationId,
          metadata: {
            organizationId,
            plan: plan.toLowerCase(),
          },
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `SpendGuard ${plan.toUpperCase()} Plan`,
                  description: `Subscription to SpendGuard ${plan} tier`,
                },
                unit_amount: this.getPlanPriceCents(plan),
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          success_url: `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
          cancel_url: `${baseUrl}/billing?canceled=true`,
        });

        return {
          url: session.url ?? `${baseUrl}/billing`,
          sessionId: session.id,
        };
      } catch (err) {
        this.logger.error(`Stripe checkout creation error: ${(err as Error).message}`);
        throw new BadRequestException(`Failed to create Stripe checkout session: ${(err as Error).message}`);
      }
    }

    // Simulation fallback for local/test environments
    const mockSessionId = `cs_test_${Date.now()}_${organizationId}`;
    return {
      url: `${baseUrl}/billing/mock-checkout?session_id=${mockSessionId}&plan=${plan}`,
      sessionId: mockSessionId,
    };
  }

  async createCustomerPortalSession(params: CreatePortalParams): Promise<{ url: string }> {
    const { customerId, returnUrl } = params;
    const baseUrl = returnUrl ?? process.env.APP_BASE_URL ?? "http://localhost:3000";

    if (this.stripeClient && customerId) {
      try {
        const session = await this.stripeClient.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${baseUrl}/billing`,
        });
        return { url: session.url };
      } catch (err) {
        this.logger.error(`Stripe portal creation error: ${(err as Error).message}`);
        throw new BadRequestException(`Failed to create Stripe portal session: ${(err as Error).message}`);
      }
    }

    return { url: `${baseUrl}/billing/portal-mock` };
  }

  constructEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (this.stripeClient && webhookSecret) {
      try {
        return this.stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        this.logger.error(`Stripe webhook signature verification failed: ${(err as Error).message}`);
        throw new BadRequestException(`Invalid Stripe webhook signature: ${(err as Error).message}`);
      }
    }

    // If in test or raw event parsing mode
    try {
      if (!signature) {
        throw new BadRequestException("Missing stripe-signature header");
      }
      const payloadString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf-8");
      return JSON.parse(payloadString) as Stripe.Event;
    } catch (err) {
      throw new BadRequestException(`Failed to parse webhook payload: ${(err as Error).message}`);
    }
  }

  private getPlanPriceCents(plan: string): number {
    switch (plan.toLowerCase()) {
      case "growth":
        return 4900; // $49/mo
      case "pro":
        return 19900; // $199/mo
      case "enterprise":
        return 59900; // $599/mo
      default:
        return 0; // starter
    }
  }
}
