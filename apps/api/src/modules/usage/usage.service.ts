import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UsageRecord } from "./entities/usage-record.entity";
import { CostRecord } from "./entities/cost-record.entity";
import { Project } from "./entities/project.entity";
import { ProviderConnection } from "../providers/entities/provider-connection.entity";
import { CostCalculatorService } from "./cost-calculator/cost-calculator.service";
import { Tag } from "../tags/entities";
import { UsageRecordTag } from "../tags/usage-record-tag.entity";
import { UsageInput } from "./usage-input";

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageRecord)
    private readonly usageRepository: Repository<UsageRecord>,

    @InjectRepository(CostRecord)
    private readonly costRepository: Repository<CostRecord>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProviderConnection)
    private readonly providerConnectionRepository: Repository<ProviderConnection>,

    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,

    @InjectRepository(UsageRecordTag)
    private readonly usageRecordTagRepository: Repository<UsageRecordTag>,

    private readonly costCalculator: CostCalculatorService,
  ) {}

  async ingest(rows: UsageInput[]) {
    if (!Array.isArray(rows)) {
      throw new Error("Usage rows must be an array");
    }

    if (rows.length === 0) {
      return [];
    }

    return this.usageRepository.manager.transaction(async (manager) => {
      const usageRepository = manager.getRepository(UsageRecord);
      const costRepository = manager.getRepository(CostRecord);
      const providerConnectionRepository =
        manager.getRepository(ProviderConnection);
      const projectRepository = manager.getRepository(Project);

      const results = [];

      for (const row of rows) {
        if (!row.organizationId) {
          throw new Error("organizationId is required");
        }

        if (!row.providerConnectionId) {
          throw new Error("providerConnectionId is required");
        }

        if (!row.sourceRecordId) {
          throw new Error("sourceRecordId is required");
        }

        if (!row.model) {
          throw new Error("model is required");
        }

        if (!Number.isFinite(row.inputTokens) || row.inputTokens < 0) {
          throw new Error("inputTokens must be a non-negative number");
        }

        if (!Number.isFinite(row.outputTokens) || row.outputTokens < 0) {
          throw new Error("outputTokens must be a non-negative number");
        }

        const cachedTokens = row.cachedTokens ?? 0;

        if (!Number.isFinite(cachedTokens) || cachedTokens < 0) {
          throw new Error("cachedTokens must be a non-negative number");
        }

        if (cachedTokens > row.inputTokens) {
          throw new Error("cachedTokens cannot exceed inputTokens");
        }

        const occurredAt = row.occurredAt ?? new Date();

        if (
          !(occurredAt instanceof Date) ||
          Number.isNaN(occurredAt.getTime())
        ) {
          throw new Error("occurredAt must be a valid date");
        }

        const providerConnection =
          await providerConnectionRepository.findOne({
            where: {
              id: row.providerConnectionId,
              organizationId: row.organizationId,
              active: true,
            },
          });

        if (!providerConnection) {
          throw new Error(
            `Active provider connection not found: ${row.providerConnectionId}`,
          );
        }

        if (row.projectId) {
          const project = await projectRepository.findOne({
            where: {
              id: row.projectId,
              organizationId: row.organizationId,
            },
          });

          if (!project) {
            throw new Error(
              `Project not found for organization: ${row.projectId}`,
            );
          }
        }

        const existingUsage = await usageRepository.findOne({
          where: {
            organizationId: row.organizationId,
            providerConnectionId: row.providerConnectionId,
            sourceRecordId: row.sourceRecordId,
          },
        });

        if (existingUsage) {
          results.push({
            usageRecord: existingUsage,
            ingested: false,
            costUsd: null,
          });

          continue;
        }

        const cost = this.costCalculator.calculate(
          providerConnection.provider,
          row.model,
          row.inputTokens,
          row.outputTokens,
          cachedTokens,
        );

        const usageRecord = usageRepository.create({
          organizationId: row.organizationId,
          providerConnectionId: row.providerConnectionId,
          sourceRecordId: row.sourceRecordId,
          model: row.model,
          inputTokens: row.inputTokens,
          outputTokens: row.outputTokens,
          cachedTokens,
          projectId: row.projectId,
          occurredAt,
        });

        const savedUsageRecord =
          await usageRepository.save(usageRecord);

        const costRecord = costRepository.create({
          usageRecordId: savedUsageRecord.id,
          costUsd: cost.toString(),
        });

        await costRepository.save(costRecord);

        results.push({
          usageRecord: savedUsageRecord,
          costUsd: cost,
          ingested: true,
        });
      }

      return results;
    });
  }

  async summary() {
    const usageRecords = await this.usageRepository.find();

    const totalRequests = usageRecords.length;

    const totalTokens = usageRecords.reduce(
      (sum, record) =>
        sum + record.inputTokens + record.outputTokens,
      0,
    );

    if (totalRequests === 0) {
      return {
        totalSpendUsd: 0,
        totalRequests: 0,
        totalTokens: 0,
        avgCostPerRequestUsd: 0,
      };
    }

    const usageIds = usageRecords.map((record) => record.id);

    const costRecords = await this.costRepository
      .createQueryBuilder("cost")
      .where("cost.usageRecordId IN (:...usageIds)", {
        usageIds,
      })
      .getMany();

    const totalSpendUsd = costRecords.reduce(
      (sum, record) => sum + Number(record.costUsd),
      0,
    );

    return {
      totalSpendUsd,
      totalRequests,
      totalTokens,
      avgCostPerRequestUsd:
        totalSpendUsd / totalRequests,
    };
  }

  async breakdown(
    by: "provider" | "model" | "project" |"tag" | "team" = "provider",
  ) {
    const usageRecords = await this.usageRepository.find();

    if (usageRecords.length === 0) {
      return [];
    }

    const usageIds = usageRecords.map((record) => record.id);

    const costRecords = await this.costRepository
      .createQueryBuilder("cost")
      .where("cost.usageRecordId IN (:...usageIds)", {
        usageIds,
      })
      .getMany();

    const costByUsageId = new Map<string, number>();

    for (const costRecord of costRecords) {
      costByUsageId.set(
        costRecord.usageRecordId,
        Number(costRecord.costUsd),
      );
    }

    const providerConnections =
      await this.providerConnectionRepository.find();

    const providerByConnectionId = new Map(
      providerConnections.map((connection) => [
        connection.id,
        connection.provider,
      ]),
    );

    const groups = new Map<
      string,
      {
        key: string;
        totalSpendUsd: number;
        totalRequests: number;
        totalTokens: number;
      }
    >();

    for (const usage of usageRecords) {
      if (by === "tag" || by === "team" ) {
        let usageTags =
  await this.usageRecordTagRepository.find({
    where: {
      usageRecordId: usage.id,
    },
  });

if (by === "team") {
  const teamTags = [];

  for (const usageTag of usageTags) {
    const tag = await this.tagRepository.findOne({
      where: {
        id: usageTag.tagId,
      },
    });

    if (tag?.key === "team") {
      teamTags.push(usageTag);
    }
  }

  usageTags = teamTags;
}

        if (usageTags.length === 0) {
          const key = "unassigned";

          if (!groups.has(key)) {
            groups.set(key, {
              key,
              totalSpendUsd: 0,
              totalRequests: 0,
              totalTokens: 0,
            });
          }

          const group = groups.get(key)!;

          group.totalSpendUsd +=
            costByUsageId.get(usage.id) ?? 0;

          group.totalRequests += 1;

          group.totalTokens +=
            usage.inputTokens + usage.outputTokens;

          continue;
        }

        for (const usageTag of usageTags) {
          const tag = await this.tagRepository.findOne({
            where: {
              id: usageTag.tagId,
            },
          });

          if (!tag) {
            continue;
          }

          const key = `${tag.key}:${tag.value}`;

          if (!groups.has(key)) {
            groups.set(key, {
              key,
              totalSpendUsd: 0,
              totalRequests: 0,
              totalTokens: 0,
            });
          }

          const group = groups.get(key)!;
          const allocation = 1 / usageTags.length;

          group.totalSpendUsd +=
            (costByUsageId.get(usage.id) ?? 0) *
            allocation;

          group.totalRequests += allocation;

          group.totalTokens +=
            (usage.inputTokens + usage.outputTokens) *
            allocation;
        }

        continue;
      }

      let key: string;

      if (by === "provider") {
        key =
          providerByConnectionId.get(
            usage.providerConnectionId,
          ) ?? "unknown";
      } else if (by === "model") {
        key = usage.model;
      } else {
        key = usage.projectId ?? "unassigned";
      }

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          totalSpendUsd: 0,
          totalRequests: 0,
          totalTokens: 0,
        });
      }

      const group = groups.get(key)!;

      group.totalSpendUsd +=
        costByUsageId.get(usage.id) ?? 0;

      group.totalRequests += 1;

      group.totalTokens +=
        usage.inputTokens + usage.outputTokens;
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      avgCostPerRequestUsd:
        group.totalRequests === 0
          ? 0
          : group.totalSpendUsd / group.totalRequests,
    }));
  }
}