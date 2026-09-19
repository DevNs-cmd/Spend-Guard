import { BudgetsService } from "./budgets.service";
import { Budget } from "./entities/budget.entity";
import { Alert } from "./entities/alert.entity";
import { Project } from "../usage/entities/project.entity";
import { AlertsService } from "./alerts/alerts.service";
import { UsageService } from "../usage/usage.service";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("BudgetsService", () => {
  let service: BudgetsService;
  let budgetRepo: any;
  let alertRepo: any;
  let projectRepo: any;
  let alertsService: any;
  let usageService: any;
  let analyticsService: any;

  const mockOrgId = "org-alpha-123";
  const otherOrgId = "org-beta-456";

  beforeEach(() => {
    const budgetsStore: Budget[] = [];
    const alertsStore: Alert[] = [];

    budgetRepo = {
      find: jest.fn(async (options) => {
        if (options?.where?.active !== undefined) {
          return budgetsStore.filter((b) => b.active === options.where.active);
        }
        if (options?.where?.organizationId) {
          return budgetsStore.filter((b) => b.organizationId === options.where.organizationId);
        }
        return budgetsStore;
      }),
      findOne: jest.fn(async ({ where }) => {
        return (
          budgetsStore.find((b) => {
            if (where.id && b.id !== where.id) return false;
            if (where.organizationId && b.organizationId !== where.organizationId) return false;
            return true;
          }) || null
        );
      }),
      create: jest.fn((dto) => ({
        id: `budget-${Date.now()}-${Math.random()}`,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest.fn(async (budget) => {
        const idx = budgetsStore.findIndex((b) => b.id === budget.id);
        if (idx >= 0) {
          budgetsStore[idx] = budget;
        } else {
          budgetsStore.push(budget);
        }
        return budget;
      }),
      remove: jest.fn(async (budget) => {
        const idx = budgetsStore.findIndex((b) => b.id === budget.id);
        if (idx >= 0) budgetsStore.splice(idx, 1);
      }),
    };

    alertRepo = {
      find: jest.fn(async ({ where }) => {
        return alertsStore.filter((a) => a.organizationId === where.organizationId);
      }),
      findOne: jest.fn(async ({ where }) => {
        return (
          alertsStore.find(
            (a) =>
              a.budgetId === where.budgetId &&
              a.severity === where.severity &&
              a.periodKey === where.periodKey,
          ) || null
        );
      }),
      create: jest.fn((dto) => ({
        id: `alert-${Date.now()}-${Math.random()}`,
        ...dto,
        firedAt: new Date(),
      })),
      save: jest.fn(async (alert) => {
        alertsStore.push(alert);
        return alert;
      }),
    };

    projectRepo = {
      findOne: jest.fn(async ({ where }) => {
        if (where.id === "proj-valid" && where.organizationId === mockOrgId) {
          return { id: "proj-valid", organizationId: mockOrgId, name: "Valid Project" };
        }
        return null;
      }),
    };

    alertsService = {
      dispatch: jest.fn(async () => {}),
    };

    usageService = {
      summary: jest.fn(async () => ({
        totalSpendUsd: 75.0,
        totalRequests: 100,
        totalTokens: 50000,
        avgCostPerRequestUsd: 0.75,
      })),
      breakdown: jest.fn(async (by) => {
        if (by === "project") {
          return [{ key: "proj-valid", totalSpendUsd: 80.0, totalRequests: 50, totalTokens: 25000, avgCostPerRequestUsd: 1.6 }];
        }
        if (by === "team") {
          return [{ key: "team:backend", totalSpendUsd: 40.0, totalRequests: 30, totalTokens: 15000, avgCostPerRequestUsd: 1.33 }];
        }
        return [{ key: "openai", totalSpendUsd: 75.0, totalRequests: 100, totalTokens: 50000, avgCostPerRequestUsd: 0.75 }];
      }),
    };

    analyticsService = {
      forecast: jest.fn(async () => ({
        spentSoFarUsd: 40.0,
        dailyAverageUsd: 4.0,
        daysRemainingInMonth: 20,
        projectedTotalUsd: 120.0,
      })),
    };

    service = new BudgetsService(
      budgetRepo,
      alertRepo,
      projectRepo,
      alertsService,
      usageService,
      analyticsService,
    );
  });

  describe("Budget Management & Validation", () => {
    it("creates an organization-scoped budget when soft limit <= hard limit", async () => {
      const budget = await service.create(mockOrgId, {
        scope: "organization",
        softLimitUsd: 50,
        hardLimitUsd: 100,
        period: "monthly",
      });

      expect(budget.id).toBeDefined();
      expect(budget.organizationId).toBe(mockOrgId);
      expect(budget.softLimitUsd).toBe("50.00");
      expect(budget.hardLimitUsd).toBe("100.00");
    });

    it("throws BadRequestException if soft limit exceeds hard limit", async () => {
      await expect(
        service.create(mockOrgId, {
          scope: "organization",
          softLimitUsd: 150,
          hardLimitUsd: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("validates project ownership when creating a project-scoped budget", async () => {
      await expect(
        service.create(mockOrgId, {
          scope: "project",
          projectId: "proj-nonexistent",
          softLimitUsd: 50,
          hardLimitUsd: 100,
        }),
      ).rejects.toThrow(BadRequestException);

      const validProjectBudget = await service.create(mockOrgId, {
        scope: "project",
        projectId: "proj-valid",
        softLimitUsd: 50,
        hardLimitUsd: 100,
      });
      expect(validProjectBudget.projectId).toBe("proj-valid");
    });

    it("enforces organization isolation on findById and update", async () => {
      const budget = await service.create(mockOrgId, {
        softLimitUsd: 50,
        hardLimitUsd: 100,
      });

      // Accessible to owner org
      const found = await service.findById(mockOrgId, budget.id);
      expect(found.id).toBe(budget.id);

      // Inaccessible to another org
      await expect(service.findById(otherOrgId, budget.id)).rejects.toThrow(NotFoundException);
      await expect(
        service.update(otherOrgId, budget.id, { softLimitUsd: 60 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("checkThresholds() & Alert Generation", () => {
    it("fires a soft limit alert and dispatches notification when spend >= softLimit", async () => {
      // Current org spend is 75.00
      await service.create(mockOrgId, {
        softLimitUsd: 50.0,
        hardLimitUsd: 100.0,
        period: "monthly",
      });

      const result = await service.checkThresholds();
      expect(result.checkedBudgets).toBe(1);
      expect(result.alertsFired).toBe(1);

      expect(alertRepo.save).toHaveBeenCalledTimes(1);
      expect(alertsService.dispatch).toHaveBeenCalledTimes(1);
      const savedAlert = alertRepo.save.mock.calls[0][0];
      expect(savedAlert.severity).toBe("soft");
      expect(savedAlert.currentSpendUsd).toBe("75.00");
    });

    it("fires a hard limit alert when spend >= hardLimit", async () => {
      // Current org spend is 75.00
      await service.create(mockOrgId, {
        softLimitUsd: 30.0,
        hardLimitUsd: 70.0,
        period: "monthly",
      });

      const result = await service.checkThresholds();
      expect(result.alertsFired).toBe(1);

      const savedAlert = alertRepo.save.mock.calls[0][0];
      expect(savedAlert.severity).toBe("hard");
    });

    it("fires a forecast alert when current spend is below hard limit but projected spend breaches", async () => {
      // Current spend is 75.00, hard limit is 100.00, forecast projected spend is 120.00
      await service.create(mockOrgId, {
        softLimitUsd: 80.0, // not yet breached
        hardLimitUsd: 100.0, // not yet breached by current spend (75)
        period: "monthly",
      });

      const result = await service.checkThresholds();
      expect(result.alertsFired).toBe(1);

      const savedAlert = alertRepo.save.mock.calls[0][0];
      expect(savedAlert.severity).toBe("forecast");
      expect(savedAlert.thresholdUsd).toBe("100.00");
    });

    it("prevents duplicate alerts on repeated executions for the same period and breach", async () => {
      await service.create(mockOrgId, {
        softLimitUsd: 50.0,
        hardLimitUsd: 100.0,
        period: "monthly",
      });

      // First run fires alert
      const firstRun = await service.checkThresholds();
      expect(firstRun.alertsFired).toBe(1);

      // Second run on same spend should not fire duplicate alert
      const secondRun = await service.checkThresholds();
      expect(secondRun.alertsFired).toBe(0);
      expect(alertRepo.save).toHaveBeenCalledTimes(1);
      expect(alertsService.dispatch).toHaveBeenCalledTimes(1);
    });
  });
});
