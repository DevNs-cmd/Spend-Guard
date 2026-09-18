import { Inject, Injectable } from "@nestjs/common";
import { USAGE_SOURCE, UsageSourcePort } from "./interfaces/usage-source.interface";
import { RecommendationEngineService, Recommendation } from "./engine/recommendation-engine.service";

const DEFAULT_LOOKBACK_DAYS = 30;

@Injectable()
export class RecommendationsService {
  constructor(
    @Inject(USAGE_SOURCE) private readonly usageSource: UsageSourcePort,
    private readonly engine: RecommendationEngineService,
  ) {}

  async generate(organizationId: string): Promise<Recommendation[]> {
    const aggregates = await this.usageSource.getModelUsageAggregates(
      organizationId,
      DEFAULT_LOOKBACK_DAYS,
    );
    return this.engine.generate(aggregates);
  }
}
