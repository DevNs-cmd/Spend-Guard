import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export type BudgetScope = "organization" | "project" | "team";
export type BudgetPeriod = "monthly" | "weekly" | "daily";

@Entity("budget")
@Index(["organizationId", "active"])
export class Budget {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column({
    type: "varchar",
    default: "organization",
  })
  scope: BudgetScope;

  @Column({ type: "varchar", nullable: true })
  projectId?: string | null;

  @Column({ type: "varchar", nullable: true })
  teamTagValue?: string | null;

  @Column("decimal", { precision: 12, scale: 2 })
  softLimitUsd: string;

  @Column("decimal", { precision: 12, scale: 2 })
  hardLimitUsd: string;

  @Column({
    type: "varchar",
    default: "monthly",
  })
  period: BudgetPeriod;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
