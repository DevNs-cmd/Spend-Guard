import { BudgetScope, BudgetPeriod } from "../entities/budget.entity";

export class CreateBudgetDto {
  scope?: BudgetScope;
  projectId?: string;
  teamTagValue?: string;
  softLimitUsd: number | string;
  hardLimitUsd: number | string;
  period?: BudgetPeriod;
  active?: boolean;
}

export class UpdateBudgetDto {
  scope?: BudgetScope;
  projectId?: string;
  teamTagValue?: string;
  softLimitUsd?: number | string;
  hardLimitUsd?: number | string;
  period?: BudgetPeriod;
  active?: boolean;
}
