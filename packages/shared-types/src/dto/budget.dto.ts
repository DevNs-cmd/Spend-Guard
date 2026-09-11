export interface BudgetDto {
  id: string;
  scope: "organization" | "project" | "team";
  softLimitUsd: number;
  hardLimitUsd: number;
}
