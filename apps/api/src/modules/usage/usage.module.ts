import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tag } from "../tags/entities";
import { UsageRecordTag } from "../tags/usage-record-tag.entity";

import { UsageController } from "./usage.controller";
import { UsageService } from "./usage.service";
import { UsageRecord } from "./entities/usage-record.entity";
import { CostRecord } from "./entities/cost-record.entity";
import { Project } from "./entities/project.entity";
import { ProviderConnection } from "../providers/entities/provider-connection.entity";
import { CostCalculatorService } from "./cost-calculator/cost-calculator.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsageRecord,
      CostRecord,
      Project,
      ProviderConnection,
    ]),
  ],
  controllers: [UsageController],
  providers: [UsageService, CostCalculatorService],
  exports: [UsageService],
})
export class UsageModule {}