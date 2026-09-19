import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";

import { TagsService } from "./tags.service";

@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll(
    @Body("organizationId") organizationId: string,
  ) {
    return this.tagsService.findAll(organizationId);
  }

  @Post()
  create(
    @Body("organizationId") organizationId: string,
    @Body("key") key: string,
    @Body("value") value: string,
  ) {
    return this.tagsService.create(
      organizationId,
      key,
      value,
    );
  }

  @Post("/usage/:id/tags")
  attachToUsage(
    @Param("id") usageRecordId: string,
    @Body("organizationId") organizationId: string,
    @Body("tagId") tagId: string,
  ) {
    return this.tagsService.attachToUsage(
      organizationId,
      usageRecordId,
      tagId,
    );
  }
}