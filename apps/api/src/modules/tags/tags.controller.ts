// Endpoints: GET /tags, POST /tags, POST /usage/:id/tags
import { Controller, Get, Post } from "@nestjs/common";
import { TagsService } from "./tags.service";

@Controller("tags")
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Post()
  create() {
    return this.tagsService.create();
  }
}
