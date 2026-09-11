// ProviderConnection: org's connection to OpenAI/Anthropic/Gemini/etc.
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class ProviderConnection {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() organizationId: string;
  @Column() provider: "openai" | "anthropic" | "gemini" | "other";
  @Column() encryptedApiKey: string;
  @Column({ default: true }) active: boolean;
}
