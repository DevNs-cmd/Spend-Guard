import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { StripeWebhookController } from "./stripe/webhook.controller";
import { StripeService } from "./stripe/stripe.service";
import { PlanService } from "./plan.service";
import { Organization } from "../organizations/entities/organization.entity";
import { Project } from "../usage/entities/project.entity";
import { ProviderConnection } from "../providers/entities/provider-connection.entity";
import { Membership } from "../organizations/entities/membership.entity";
import { ProcessedWebhook } from "./entities/processed-webhook.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      Project,
      ProviderConnection,
      Membership,
      ProcessedWebhook,
    ]),
  ],
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, StripeService, PlanService],
  exports: [BillingService, PlanService, StripeService],
})
export class BillingModule {}
