import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Organization } from "../organizations/entities/organization.entity";
import { ProcessedWebhook } from "./entities/processed-webhook.entity";
import { StripeService } from "./stripe/stripe.service";
import { PlanService } from "./plan.service";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,

    @InjectRepository(ProcessedWebhook)
    private readonly webhookRepository: Repository<ProcessedWebhook>,

    private readonly stripeService: StripeService,
    private readonly planService: PlanService,
  ) {}

  async getPlan(organizationId: string) {
    const limitsInfo = await this.planService.getOrganizationLimits(organizationId);
    return {
      organizationId,
      plan: limitsInfo.plan,
      limits: limitsInfo.limits,
      usage: limitsInfo.currentCounts,
    };
  }

  async createCheckoutSession(
    organizationId: string,
    plan: string,
    customerEmail?: string,
    returnUrl?: string,
  ) {
    const normalizedPlan = (plan || "").toLowerCase();
    if (!["starter", "growth", "pro", "enterprise"].includes(normalizedPlan)) {
      throw new BadRequestException(`Invalid plan: ${plan}. Allowed tiers: starter, growth, pro, enterprise`);
    }

    const org = await this.orgRepository.findOne({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    return this.stripeService.createCheckoutSession({
      organizationId,
      plan: normalizedPlan,
      customerEmail,
      returnUrl,
    });
  }

  async createCustomerPortalSession(organizationId: string, returnUrl?: string) {
    const org = await this.orgRepository.findOne({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    return this.stripeService.createCustomerPortalSession({
      customerId: (org as any).stripeCustomerId ?? `cus_${organizationId}`,
      returnUrl,
    });
  }

  /**
   * Idempotent webhook event processor.
   * Handles checkout.session.completed, customer.subscription.updated/deleted.
   */
  async handleWebhookEvent(event: any): Promise<{ status: string; eventId: string }> {
    const eventId = event?.id;
    const eventType = event?.type;

    if (!eventId || !eventType) {
      throw new BadRequestException("Invalid webhook event object");
    }

    // 1. Idempotency Check
    const existing = await this.webhookRepository.findOne({
      where: { eventId },
    });

    if (existing) {
      this.logger.log(`Webhook event ${eventId} (${eventType}) already processed. Skipping.`);
      return { status: "already_processed", eventId };
    }

    // 2. Process specific event types
    try {
      if (eventType === "checkout.session.completed") {
        const session = event.data?.object;
        const orgId = session?.client_reference_id || session?.metadata?.organizationId;
        const newPlan = (session?.metadata?.plan || "pro").toLowerCase();

        if (orgId) {
          const org = await this.orgRepository.findOne({ where: { id: orgId } });
          if (org) {
            org.plan = newPlan;
            await this.orgRepository.save(org);
            this.logger.log(`Upgraded org ${orgId} plan to ${newPlan} via checkout session`);
          }
        }
      } else if (
        eventType === "customer.subscription.updated" ||
        eventType === "customer.subscription.created"
      ) {
        const subscription = event.data?.object;
        const orgId = subscription?.metadata?.organizationId;
        const newPlan = (subscription?.metadata?.plan || "pro").toLowerCase();

        if (orgId) {
          const org = await this.orgRepository.findOne({ where: { id: orgId } });
          if (org) {
            org.plan = newPlan;
            await this.orgRepository.save(org);
            this.logger.log(`Updated org ${orgId} subscription plan to ${newPlan}`);
          }
        }
      } else if (eventType === "customer.subscription.deleted") {
        const subscription = event.data?.object;
        const orgId = subscription?.metadata?.organizationId;

        if (orgId) {
          const org = await this.orgRepository.findOne({ where: { id: orgId } });
          if (org) {
            org.plan = "starter";
            await this.orgRepository.save(org);
            this.logger.log(`Downgraded org ${orgId} to starter plan following subscription cancellation`);
          }
        }
      }

      // 3. Record processed webhook for idempotency
      const processed = this.webhookRepository.create({
        eventId,
        eventType,
      });
      await this.webhookRepository.save(processed);

      return { status: "processed", eventId };
    } catch (err) {
      this.logger.error(`Error processing webhook ${eventId}: ${(err as Error).message}`);
      throw err;
    }
  }
}
