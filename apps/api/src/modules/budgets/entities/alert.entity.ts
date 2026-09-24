import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  Index,
} from "typeorm";

export type AlertSeverity = "soft" | "hard" | "forecast";

@Entity("alert")
@Unique("UQ_alert_budget_severity_period", ["budgetId", "severity", "periodKey"])
@Index(["organizationId", "firedAt"])
export class Alert {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  budgetId: string;

  @Column({
    type: "varchar",
  })
  severity: AlertSeverity;

  @Column("decimal", { precision: 12, scale: 2, nullable: true })
  currentSpendUsd: string;

  @Column("decimal", { precision: 12, scale: 2, nullable: true })
  thresholdUsd: string;

  @Column({ type: "varchar" })
  periodKey: string;

  @CreateDateColumn({ type: "timestamptz" })
  firedAt: Date;
}
