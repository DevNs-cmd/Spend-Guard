// Budget: scope (org/project/team), soft & hard limit, period.
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Budget {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() organizationId: string;
  @Column({ nullable: true }) projectId: string;
  @Column("decimal") softLimitUsd: string;
  @Column("decimal") hardLimitUsd: string;
}
