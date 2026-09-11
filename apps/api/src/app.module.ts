// Root module registry. Shared file — add your module import via PR.
import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { ProvidersModule } from "./modules/providers/providers.module";
import { UsageModule } from "./modules/usage/usage.module";
import { TagsModule } from "./modules/tags/tags.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { BillingModule } from "./modules/billing/billing.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";

@Module({
  imports: [
    AuthModule,
    OrganizationsModule,
    ProvidersModule,
    UsageModule,
    TagsModule,
    BudgetsModule,
    ReportsModule,
    BillingModule,
    AnalyticsModule,
    RecommendationsModule,
  ],
})
export class AppModule {}
