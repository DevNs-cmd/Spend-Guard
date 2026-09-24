import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  Optional,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Budget } from "./entities/budget.entity";
import { Alert, AlertSeverity } from "./entities/alert.entity";
import { CreateBudgetDto, UpdateBudgetDto } from "./dto/budget.dto";
import { AlertsService } from "./alerts/alerts.service";
import { UsageService } from "../usage/usage.service";
import { Project } from "../usage/entities/project.entity";
import { AnalyticsService } from "../analytics/analytics.service";
import { ForecastService } from "../analytics/forecasting/forecast.service";

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,

    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    private readonly alertsService: AlertsService,
    private readonly usageService: UsageService,

    @Optional()
    private readonly analyticsService?: AnalyticsService,

    @Optional()
    private readonly forecastService?: ForecastService,
  ) {}

  async findAll(organizationId: string): Promise<Budget[]> {
    return this.budgetRepository.find({
      where: { organizationId },
      order: { createdAt: "DESC" },
    });
  }

  async findById(organizationId: string, id: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id, organizationId },
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    return budget;
  }

  async create(organizationId: string, dto: CreateBudgetDto): Promise<Budget> {
    const softLimit = Number(dto.softLimitUsd);
    const hardLimit = Number(dto.hardLimitUsd);

    if (isNaN(softLimit) || softLimit < 0) {
      throw new BadRequestException("softLimitUsd must be a non-negative number");
    }
    if (isNaN(hardLimit) || hardLimit <= 0) {
      throw new BadRequestException("hardLimitUsd must be a positive number");
    }
    if (softLimit > hardLimit) {
      throw new BadRequestException("Soft limit cannot exceed hard limit");
    }

    if (dto.scope === "project" && dto.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: dto.projectId, organizationId },
      });
      if (!project) {
        throw new BadRequestException(`Project not found for this organization: ${dto.projectId}`);
      }
    }

    const budget = this.budgetRepository.create({
      organizationId,
      scope: dto.scope ?? "organization",
      projectId: dto.projectId ?? null,
      teamTagValue: dto.teamTagValue ?? null,
      softLimitUsd: softLimit.toFixed(2),
      hardLimitUsd: hardLimit.toFixed(2),
      period: dto.period ?? "monthly",
      active: dto.active ?? true,
    });

    return this.budgetRepository.save(budget);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateBudgetDto,
  ): Promise<Budget> {
    const budget = await this.findById(organizationId, id);

    const softLimit = dto.softLimitUsd !== undefined ? Number(dto.softLimitUsd) : Number(budget.softLimitUsd);
    const hardLimit = dto.hardLimitUsd !== undefined ? Number(dto.hardLimitUsd) : Number(budget.hardLimitUsd);

    if (softLimit > hardLimit) {
      throw new BadRequestException("Soft limit cannot exceed hard limit");
    }

    if (dto.scope === "project" && dto.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: dto.projectId, organizationId },
      });
      if (!project) {
        throw new BadRequestException(`Project not found for this organization: ${dto.projectId}`);
      }
    }

    if (dto.scope !== undefined) budget.scope = dto.scope;
    if (dto.projectId !== undefined) budget.projectId = dto.projectId;
    if (dto.teamTagValue !== undefined) budget.teamTagValue = dto.teamTagValue;
    if (dto.softLimitUsd !== undefined) budget.softLimitUsd = Number(dto.softLimitUsd).toFixed(2);
    if (dto.hardLimitUsd !== undefined) budget.hardLimitUsd = Number(dto.hardLimitUsd).toFixed(2);
    if (dto.period !== undefined) budget.period = dto.period;
    if (dto.active !== undefined) budget.active = dto.active;

    return this.budgetRepository.save(budget);
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const budget = await this.findById(organizationId, id);
    await this.budgetRepository.remove(budget);
  }

  async getAlerts(organizationId: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { organizationId },
      order: { firedAt: "DESC" },
    });
  }

  /**
   * Helper to format period key for idempotency deduplication.
   */
  getPeriodKey(date: Date, period: "monthly" | "weekly" | "daily"): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    if (period === "daily") {
      return `${y}-${m}-${d}`;
    }
    if (period === "weekly") {
      const startOfYear = new Date(y, 0, 1);
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      return `${y}-W${String(weekNumber).padStart(2, "0")}`;
    }
    return `${y}-${m}`;
  }

  /**
   * Main recurring checkThresholds method called by BullMQ scheduler or API.
   */
  async checkThresholds(): Promise<{ checkedBudgets: number; alertsFired: number }> {
    const activeBudgets = await this.budgetRepository.find({
      where: { active: true },
    });

    this.logger.log(`Evaluating spend thresholds for ${activeBudgets.length} active budget(s)`);
    let alertsFired = 0;
    const now = new Date();

    for (const budget of activeBudgets) {
      try {
        const periodKey = this.getPeriodKey(now, budget.period);
        const currentSpend = await this.resolveCurrentSpend(budget);
        const softLimit = Number(budget.softLimitUsd);
        const hardLimit = Number(budget.hardLimitUsd);

        // 1. Check Hard Limit Breach
        if (currentSpend >= hardLimit) {
          const fired = await this.createAlertIfNew(budget, "hard", currentSpend, hardLimit, periodKey);
          if (fired) alertsFired++;
        }
        // 2. Check Soft Limit Breach
        else if (currentSpend >= softLimit) {
          const fired = await this.createAlertIfNew(budget, "soft", currentSpend, softLimit, periodKey);
          if (fired) alertsFired++;
        }
        // 3. Forecast Check (Spend is currently below hard limit, but forecast projects breach)
        else {
          const forecastProjected = await this.resolveForecastSpend(budget);
          if (forecastProjected !== null && forecastProjected >= hardLimit) {
            const fired = await this.createAlertIfNew(budget, "forecast", currentSpend, hardLimit, periodKey);
            if (fired) alertsFired++;
          }
        }
      } catch (err) {
        this.logger.error(`Error checking budget ${budget.id}: ${(err as Error).message}`);
      }
    }

    return { checkedBudgets: activeBudgets.length, alertsFired };
  }

  private async resolveCurrentSpend(budget: Budget): Promise<number> {
    if (budget.scope === "project" && budget.projectId) {
      const breakdown = await this.usageService.breakdown("project");
      const matched = breakdown.find((item) => item.key === budget.projectId);
      return matched?.totalSpendUsd ?? 0;
    }

    if (budget.scope === "team" && budget.teamTagValue) {
      const breakdown = await this.usageService.breakdown("team");
      const matched = breakdown.find(
        (item) => item.key === `team:${budget.teamTagValue}` || item.key === budget.teamTagValue,
      );
      return matched?.totalSpendUsd ?? 0;
    }

    // Default: organization scope
    const summary = await this.usageService.summary();
    return summary.totalSpendUsd ?? 0;
  }

  private async resolveForecastSpend(budget: Budget): Promise<number | null> {
    try {
      if (this.analyticsService) {
        const forecast = await this.analyticsService.forecast(budget.organizationId);
        return forecast.projectedTotalUsd;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async createAlertIfNew(
    budget: Budget,
    severity: AlertSeverity,
    currentSpend: number,
    threshold: number,
    periodKey: string,
  ): Promise<boolean> {
    // Check if alert already exists for this exact breach and period
    const existing = await this.alertRepository.findOne({
      where: {
        budgetId: budget.id,
        severity,
        periodKey,
      },
    });

    if (existing) {
      // Already alerted this period, do not spam
      return false;
    }

    try {
      const alert = this.alertRepository.create({
        organizationId: budget.organizationId,
        budgetId: budget.id,
        severity,
        currentSpendUsd: currentSpend.toFixed(2),
        thresholdUsd: threshold.toFixed(2),
        periodKey,
        firedAt: new Date(),
      });

      const savedAlert = await this.alertRepository.save(alert);
      this.logger.warn(
        `[ALERT FIRED] ${severity.toUpperCase()} breach for budget ${budget.id} (${budget.scope}): spend=$${currentSpend.toFixed(2)}, threshold=$${threshold.toFixed(2)}`,
      );

      // Fan out notifications
      await this.alertsService.dispatch(savedAlert, budget);
      return true;
    } catch (err: any) {
      // Catch unique constraint race condition gracefully
      if (err.code === "23505" || err.message?.includes("UQ_alert_budget_severity_period")) {
        return false;
      }
      throw err;
    }
  }
}
