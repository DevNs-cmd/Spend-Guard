import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";
import { ScheduleModule } from "@nestjs/schedule";
import { UsageModule } from "../usage/usage.module";
import { ProviderConnection } from "./entities/provider-connection.entity";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";
import { ConnectorFactory } from "./connectors/connector.factory";
import { UsageSyncProcessor } from "./workers/usage-sync.processor";
import { UsageSyncScheduler } from "./workers/usage-sync.scheduler";
import { USAGE_SYNC_QUEUE } from "./workers/usage-sync.queue";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderConnection]),
    UsageModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({ name: USAGE_SYNC_QUEUE }),
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService, ConnectorFactory, UsageSyncProcessor, UsageSyncScheduler],
  exports: [ProvidersService],
})
export class ProvidersModule {}
