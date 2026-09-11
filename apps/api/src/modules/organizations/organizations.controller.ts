// Endpoints: POST /organizations, GET /organizations/:id,
// POST /organizations/:id/members, PATCH /organizations/:id/members/:userId
import { Controller, Get, Post } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  create() {
    return this.orgsService.create();
  }

  @Get(":id")
  findOne() {
    return this.orgsService.findOne();
  }
}
