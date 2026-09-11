// CostRecord: computed cost for a UsageRecord (handles pricing changes over time).
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class CostRecord {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() usageRecordId: string;
  @Column("decimal") costUsd: string;
}
