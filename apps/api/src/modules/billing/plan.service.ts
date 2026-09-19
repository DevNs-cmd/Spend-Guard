import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Organization } from "../organizations/entities/organization.entity";
import { Project } from "../usage/entities/project.entity";
import { ProviderConnection } from "../providers/entities/provider-connection.entity";
import { Membership } from "../organizations/entities/membership.entity";

export interface PlanLimits {
  providerConnections: number;
  projects: number;
  seats: number;
  retentionDays: number;
}

export const PLAN_TIERS: Record<string, PlanLimits> = {
  starter: {
    providerConnections: 2,
    projects: 3,
    seats: 2,
    retentionDays: 30,
  },
  growth: {
    providerConnections: 5,
    projects: 10,
    seats: 10,
    retentionDays: 90,
  },
  pro: {
    providerConnections: 15,
    projects: 50,
    seats: 25,
    retentionDays: 365,
  },
  enterprise: {
    providerConnections: 9999,
    projects: 9999,
    seats: 9999,
    retentionDays: 730,
  },
};

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(ProviderConnection)
    private readonly providerConnectionRepository: Repository<ProviderConnection>,

    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  getPlanLimits(planName: string): PlanLimits {
    const normalized = (planName || "starter").toLowerCase();
    return PLAN_TIERS[normalized] ?? PLAN_TIERS.starter;
  }

  async getOrganizationLimits(organizationId: string): Promise<{
    plan: string;
    limits: PlanLimits;
    currentCounts: {
      projects: number;
      providerConnections: number;
      seats: number;
    };
  }> {
    const org = await this.orgRepository.findOne({
      where: { id: organizationId },
    });

    const plan = org?.plan ?? "starter";
    const limits = this.getPlanLimits(plan);

    const [projects, providerConnections, seats] = await Promise.all([
      this.projectRepository.count({ where: { organizationId } }),
      this.providerConnectionRepository.count({ where: { organizationId } }),
      this.membershipRepository.count({ where: { organizationId } }),
    ]);

    return {
      plan,
      limits,
      currentCounts: {
        projects,
        providerConnections,
        seats,
      },
    };
  }

  async canAddProject(organizationId: string): Promise<boolean> {
    const { plan, limits, currentCounts } = await this.getOrganizationLimits(organizationId);
    if (currentCounts.projects >= limits.projects) {
      throw new ForbiddenException(
        `Plan limit reached: your ${plan} plan allows up to ${limits.projects} projects. Please upgrade your plan.`,
      );
    }
    return true;
  }

  async canAddProviderConnection(organizationId: string): Promise<boolean> {
    const { plan, limits, currentCounts } = await this.getOrganizationLimits(organizationId);
    if (currentCounts.providerConnections >= limits.providerConnections) {
      throw new ForbiddenException(
        `Plan limit reached: your ${plan} plan allows up to ${limits.providerConnections} provider connections. Please upgrade your plan.`,
      );
    }
    return true;
  }

  async canAddSeat(organizationId: string): Promise<boolean> {
    const { plan, limits, currentCounts } = await this.getOrganizationLimits(organizationId);
    if (currentCounts.seats >= limits.seats) {
      throw new ForbiddenException(
        `Plan limit reached: your ${plan} plan allows up to ${limits.seats} seats. Please upgrade your plan.`,
      );
    }
    return true;
  }

  async getRetentionDays(organizationId: string): Promise<number> {
    const org = await this.orgRepository.findOne({
      where: { id: organizationId },
    });
    const limits = this.getPlanLimits(org?.plan ?? "starter");
    return limits.retentionDays;
  }
}
