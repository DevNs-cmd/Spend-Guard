// Endpoints: GET /budgets, POST /budgets, PATCH /budgets/:id, GET /alerts
import { Controller, Get, Post } from "@nestjs/common";
import { BudgetsService } from "./budgets.service";

@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll() {
    return this.budgetsService.findAll();
  }

  @Post()
  create() {
    return this.budgetsService.create();
  }
}
