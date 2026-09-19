import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Tag } from "./entities";
import { UsageRecordTag } from "./usage-record-tag.entity";
import { UsageRecord } from "../usage/entities/usage-record.entity";

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,

    @InjectRepository(UsageRecordTag)
    private readonly usageRecordTagRepository: Repository<UsageRecordTag>,

    @InjectRepository(UsageRecord)
    private readonly usageRepository: Repository<UsageRecord>,
  ) {}

  async findAll(organizationId: string) {
    if (!organizationId) {
      throw new Error("organizationId is required");
    }

    return this.tagRepository.find({
      where: { organizationId },
      order: {
        key: "ASC",
        value: "ASC",
      },
    });
  }

  async create(
    organizationId: string,
    key: string,
    value: string,
  ) {
    if (!organizationId) {
      throw new Error("organizationId is required");
    }

    if (!key?.trim()) {
      throw new Error("Tag key is required");
    }

    if (!value?.trim()) {
      throw new Error("Tag value is required");
    }

    const normalizedKey = key.trim();
    const normalizedValue = value.trim();

    const existing = await this.tagRepository.findOne({
      where: {
        organizationId,
        key: normalizedKey,
        value: normalizedValue,
      },
    });

    if (existing) {
      return existing;
    }

    const tag = this.tagRepository.create({
      organizationId,
      key: normalizedKey,
      value: normalizedValue,
    });

    return this.tagRepository.save(tag);
  }

  async attachToUsage(
    organizationId: string,
    usageRecordId: string,
    tagId: string,
  ) {
    if (!organizationId) {
      throw new Error("organizationId is required");
    }

    if (!usageRecordId) {
      throw new Error("usageRecordId is required");
    }

    if (!tagId) {
      throw new Error("tagId is required");
    }

    const usageRecord = await this.usageRepository.findOne({
      where: {
        id: usageRecordId,
        organizationId,
      },
    });

    if (!usageRecord) {
      throw new Error(
        `Usage record not found: ${usageRecordId}`,
      );
    }

    const tag = await this.tagRepository.findOne({
      where: {
        id: tagId,
        organizationId,
      },
    });

    if (!tag) {
      throw new Error(`Tag not found: ${tagId}`);
    }

    const existing = await this.usageRecordTagRepository.findOne({
      where: {
        usageRecordId,
        tagId,
      },
    });

    if (existing) {
      return existing;
    }

    const usageRecordTag = this.usageRecordTagRepository.create({
      usageRecordId,
      tagId,
    });

    return this.usageRecordTagRepository.save(usageRecordTag);
  }
}