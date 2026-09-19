import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
} from "typeorm";

@Entity()
@Unique(["organizationId", "providerConnectionId", "sourceRecordId"])
export class UsageRecord {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() organizationId: string;

  @Column() providerConnectionId: string;

  @Column() sourceRecordId: string;

  @Column() model: string;

  @Column() inputTokens: number;

  @Column() outputTokens: number;

  @Column({ nullable: true }) cachedTokens: number;

  @Column({ nullable: true }) projectId: string;

  @Column({ type: "timestamptz" }) occurredAt: Date;
}