import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TagsController } from "./tags.controller";
import { TagsService } from "./tags.service";
import { Tag } from "./entities";
import { UsageRecordTag } from "./usage-record-tag.entity";
import { UsageRecord } from "../usage/entities/usage-record.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tag,
      UsageRecordTag,
      UsageRecord,
    ]),
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}