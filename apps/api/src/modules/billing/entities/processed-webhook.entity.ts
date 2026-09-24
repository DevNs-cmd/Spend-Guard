import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("processed_webhook")
export class ProcessedWebhook {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true })
  @Index({ unique: true })
  eventId: string;

  @Column({ type: "varchar" })
  eventType: string;

  @CreateDateColumn({ type: "timestamptz" })
  processedAt: Date;
}
