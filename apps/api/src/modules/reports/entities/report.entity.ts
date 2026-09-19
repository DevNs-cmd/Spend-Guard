import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export type ReportFormat = "pdf" | "csv";
export type ReportFrequency = "daily" | "weekly" | "monthly" | "once";
export type ReportType = "spend_summary" | "breakdown" | "executive" | "custom";

@Entity("report")
@Index(["organizationId", "active"])
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  organizationId: string;

  @Column()
  name: string;

  @Column({
    type: "varchar",
    default: "spend_summary",
  })
  type: ReportType;

  @Column({
    type: "varchar",
    default: "pdf",
  })
  format: ReportFormat;

  @Column({
    type: "varchar",
    default: "monthly",
  })
  frequency: ReportFrequency;

  @Column({
    type: "varchar",
    default: "this_month",
  })
  dateRange: string;

  @Column("simple-array", { nullable: true })
  recipients: string[];

  @Column({ type: "varchar", unique: true })
  @Index({ unique: true })
  shareToken: string;

  @Column({ type: "timestamptz", nullable: true })
  shareExpiresAt: Date | null;

  @Column("simple-json", { nullable: true })
  filters: Record<string, any> | null;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @Column({ type: "timestamptz", nullable: true })
  lastRunAt: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
