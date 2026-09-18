import { Module } from "@nestjs/common";
import { UsageModule } from "../usage/usage.module";
import { UsageService } from "../usage/usage.service";
import { USAGE_SOURCE } from "./interfaces/usage-source.interface";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";
import { RecommendationEngineService } from "./engine/recommendation-engine.service";

@Module({
  imports: [UsageModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    RecommendationEngineService,
    { provide: USAGE_SOURCE, useExisting: UsageService },
  ],
})
export class RecommendationsModule {}
