// UsageRecord: one API call — provider, model, tokens in/out, project, tags, ts.
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class UsageRecord {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() organizationId: string;
  @Column() providerConnectionId: string;
  @Column() model: string;
  @Column() inputTokens: number;
  @Column() outputTokens: number;
  @Column({ nullable: true }) cachedTokens: number;
  @Column({ nullable: true }) projectId: string;
  @CreateDateColumn() occurredAt: Date;
}
