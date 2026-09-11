// Endpoints: GET /providers, POST /providers, DELETE /providers/:id,
// POST /providers/:id/sync (manual trigger)
import { Controller, Get, Post, Delete } from "@nestjs/common";
import { ProvidersService } from "./providers.service";

@Controller("providers")
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  findAll() {
    return this.providersService.findAll();
  }

  @Post()
  connect() {
    return this.providersService.connect();
  }

  @Delete(":id")
  disconnect() {
    return this.providersService.disconnect();
  }
}
