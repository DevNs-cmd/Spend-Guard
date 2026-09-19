import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Provider } from "@spendguard/shared-types";

// One org's connection to a single AI provider account.
// `encryptedCredentials` holds the *encrypted* JSON string of whatever that
// provider needs (see connectors/*.connector.ts for the shape each expects):
//   - OpenAI / Anthropic: { adminApiKey: string }
//   - Gemini: { gcpProjectId, billingExportDataset, billingExportTable, serviceAccountJson }
// Never decrypt this outside providers.service.ts / the sync worker, and
// never include it in any API response.
@Entity()
export class ProviderConnection {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() organizationId: string;

  @Column({ type: "enum", enum: Provider }) provider: Provider;

  @Column({ type: "text" }) encryptedCredentials: string;

  @Column({ default: true }) active: boolean;

  @Column({ type: "timestamp", nullable: true }) lastSyncedAt: Date | null;

  @Column({ type: "text", nullable: true }) lastSyncError: string | null;

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;
}
