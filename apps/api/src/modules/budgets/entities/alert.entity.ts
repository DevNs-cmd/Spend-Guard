// Alert: fired instance of a budget threshold or forecast breach.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Alert {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() organizationId: string;
  @Column() budgetId: string;
  @Column() severity: "soft" | "hard" | "forecast";
  @CreateDateColumn() firedAt: Date;
}
