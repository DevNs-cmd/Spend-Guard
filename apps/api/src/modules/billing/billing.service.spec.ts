import { BillingService } from "./billing.service";
import { PlanService } from "./plan.service";
import { StripeService } from "./stripe/stripe.service";
import { Organization } from "../organizations/entities/organization.entity";
import { ProcessedWebhook } from "./entities/processed-webhook.entity";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";

describe("BillingService & Plan Limits", () => {
  let billingService: BillingService;
  let planService: PlanService;
  let stripeService: StripeService;

  let orgRepo: any;
  let webhookRepo: any;
  let projectRepo: any;
  let providerConnectionRepo: any;
  let membershipRepo: any;

  const mockOrgId = "org-billing-101";

  beforeEach(() => {
    const orgsStore: Organization[] = [
      { id: mockOrgId, name: "Acme Corp", plan: "starter" } as Organization,
    ];
    const webhooksStore: ProcessedWebhook[] = [];
    let projectCount = 2;
    let providerConnectionCount = 1;
    let seatCount = 2;

    orgRepo = {
      findOne: jest.fn(async ({ where }) => {
        return orgsStore.find((o) => o.id === where.id) || null;
      }),
      save: jest.fn(async (org) => {
        const idx = orgsStore.findIndex((o) => o.id === org.id);
        if (idx >= 0) orgsStore[idx] = org;
        else orgsStore.push(org);
        return org;
      }),
    };

    webhookRepo = {
      findOne: jest.fn(async ({ where }) => {
        return webhooksStore.find((w) => w.eventId === where.eventId) || null;
      }),
      create: jest.fn((dto) => ({
        id: `webhook-${Date.now()}`,
        ...dto,
        processedAt: new Date(),
      })),
      save: jest.fn(async (webhook) => {
        webhooksStore.push(webhook);
        return webhook;
      }),
    };

    projectRepo = {
      count: jest.fn(async () => projectCount),
    };

    providerConnectionRepo = {
      count: jest.fn(async () => providerConnectionCount),
    };

    membershipRepo = {
      count: jest.fn(async () => seatCount),
    };

    planService = new PlanService(
      orgRepo,
      projectRepo,
      providerConnectionRepo,
      membershipRepo,
    );

    stripeService = new StripeService();

    billingService = new BillingService(
      orgRepo,
      webhookRepo,
      stripeService,
      planService,
    );
  });

  describe("Plan Limits Enforcement", () => {
    it("returns correct limits for Starter vs Pro plans", () => {
      const starterLimits = planService.getPlanLimits("starter");
      expect(starterLimits.projects).toBe(3);
      expect(starterLimits.providerConnections).toBe(2);
      expect(starterLimits.seats).toBe(2);
      expect(starterLimits.retentionDays).toBe(30);

      const proLimits = planService.getPlanLimits("pro");
      expect(proLimits.projects).toBe(50);
      expect(proLimits.providerConnections).toBe(15);
      expect(proLimits.seats).toBe(25);
      expect(proLimits.retentionDays).toBe(365);
    });

    it("allows adding projects when below limit and blocks when limit reached", async () => {
      // Starter limit is 3 projects, currently have 2
      await expect(planService.canAddProject(mockOrgId)).resolves.toBe(true);

      // Set current project count to 3 (limit reached for starter)
      projectRepo.count.mockResolvedValue(3);
      await expect(planService.canAddProject(mockOrgId)).rejects.toThrow(ForbiddenException);
    });

    it("enforces seat limits for starter plan", async () => {
      // Starter seat limit is 2, currently have 2
      await expect(planService.canAddSeat(mockOrgId)).rejects.toThrow(ForbiddenException);
    });

    it("returns retention days matching current organization plan", async () => {
      const days = await planService.getRetentionDays(mockOrgId);
      expect(days).toBe(30);
    });
  });

  describe("Checkout & Portal Sessions", () => {
    it("creates a checkout session for upgrading to Pro tier", async () => {
      const session = await billingService.createCheckoutSession(mockOrgId, "pro");
      expect(session.sessionId).toBeDefined();
      expect(session.url).toBeDefined();
    });

    it("rejects invalid plan names with BadRequestException", async () => {
      await expect(
        billingService.createCheckoutSession(mockOrgId, "invalid_tier"),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates customer portal session for existing organization", async () => {
      const portal = await billingService.createCustomerPortalSession(mockOrgId);
      expect(portal.url).toBeDefined();
    });
  });

  describe("Stripe Webhook Processing & Idempotency", () => {
    it("updates organization plan on checkout.session.completed event", async () => {
      const webhookEvent = {
        id: "evt_test_checkout_123",
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: mockOrgId,
            metadata: { organizationId: mockOrgId, plan: "pro" },
          },
        },
      };

      const result = await billingService.handleWebhookEvent(webhookEvent);
      expect(result.status).toBe("processed");

      const org = await orgRepo.findOne({ where: { id: mockOrgId } });
      expect(org.plan).toBe("pro");
      expect(webhookRepo.save).toHaveBeenCalledTimes(1);
    });

    it("skips duplicate webhook events idempotently", async () => {
      const webhookEvent = {
        id: "evt_duplicate_test_456",
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: mockOrgId,
            metadata: { organizationId: mockOrgId, plan: "growth" },
          },
        },
      };

      // First run processes
      const firstResult = await billingService.handleWebhookEvent(webhookEvent);
      expect(firstResult.status).toBe("processed");

      // Second run is skipped
      const secondResult = await billingService.handleWebhookEvent(webhookEvent);
      expect(secondResult.status).toBe("already_processed");
      expect(webhookRepo.save).toHaveBeenCalledTimes(1);
    });

    it("downgrades organization plan to starter on subscription cancellation", async () => {
      // First set plan to pro
      const org = await orgRepo.findOne({ where: { id: mockOrgId } });
      org.plan = "pro";

      const cancelEvent = {
        id: "evt_cancel_789",
        type: "customer.subscription.deleted",
        data: {
          object: {
            metadata: { organizationId: mockOrgId },
          },
        },
      };

      await billingService.handleWebhookEvent(cancelEvent);
      expect(org.plan).toBe("starter");
    });
  });
});
