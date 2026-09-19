import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProviderConnection } from "./entities/provider-connection.entity";
import { Provider } from "@spendguard/shared-types";
import { encryptSecret } from "./utils/crypto.util";
import { ConnectProviderDto } from "./dto/connect-provider.dto";
import { ProviderConnectionResponseDto } from "./dto/provider-connection-response.dto";
import { ProviderCredentials } from "./connectors/connector.factory";

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(ProviderConnection)
    private readonly connectionsRepo: Repository<ProviderConnection>,
  ) {}

  async findAll(organizationId: string): Promise<ProviderConnectionResponseDto[]> {
    const connections = await this.connectionsRepo.find({ where: { organizationId } });
    return connections.map((c) => this.toResponseDto(c));
  }

  async connect(
    organizationId: string,
    dto: ConnectProviderDto,
  ): Promise<ProviderConnectionResponseDto> {
    this.validateCredentialsShape(dto.provider, dto.credentials);

    const encryptedCredentials = encryptSecret(JSON.stringify(dto.credentials));

    const connection = this.connectionsRepo.create({
      organizationId,
      provider: dto.provider,
      encryptedCredentials,
      active: true,
      lastSyncedAt: null,
      lastSyncError: null,
    });

    const saved = await this.connectionsRepo.save(connection);
    return this.toResponseDto(saved);
  }

  async disconnect(organizationId: string, id: string): Promise<void> {
    const connection = await this.connectionsRepo.findOne({ where: { id, organizationId } });
    if (!connection) {
      throw new NotFoundException(`Provider connection ${id} not found`);
    }
    await this.connectionsRepo.remove(connection);
  }

  /** Used only by the sync worker — never expose decrypted credentials via any controller. */
  async getDecryptedCredentials(connectionId: string): Promise<{
    connection: ProviderConnection;
    credentials: ProviderCredentials;
  }> {
    const connection = await this.connectionsRepo.findOne({ where: { id: connectionId } });
    if (!connection) {
      throw new NotFoundException(`Provider connection ${connectionId} not found`);
    }
    const { decryptSecret } = await import("./utils/crypto.util");
    const credentials = JSON.parse(decryptSecret(connection.encryptedCredentials));
    return { connection, credentials };
  }

  async findAllActive(): Promise<ProviderConnection[]> {
    return this.connectionsRepo.find({ where: { active: true } });
  }

  async recordSyncSuccess(connectionId: string, syncedAt: Date): Promise<void> {
    await this.connectionsRepo.update(connectionId, {
      lastSyncedAt: syncedAt,
      lastSyncError: null,
    });
  }

  async recordSyncError(connectionId: string, error: string): Promise<void> {
    await this.connectionsRepo.update(connectionId, { lastSyncError: error });
  }

  private validateCredentialsShape(provider: Provider, credentials: unknown): void {
    if (!credentials || typeof credentials !== "object") {
      throw new BadRequestException("credentials is required");
    }
    const creds = credentials as Record<string, unknown>;

    if (provider === Provider.OpenAI || provider === Provider.Anthropic) {
      if (typeof creds.adminApiKey !== "string" || creds.adminApiKey.length === 0) {
        throw new BadRequestException(`${provider} requires a string "adminApiKey"`);
      }
      return;
    }

    if (provider === Provider.Gemini) {
      const required = [
        "gcpProjectId",
        "billingExportDataset",
        "billingExportTable",
        "serviceAccountJson",
      ];
      for (const field of required) {
        if (typeof creds[field] !== "string" || (creds[field] as string).length === 0) {
          throw new BadRequestException(`Gemini requires a string "${field}"`);
        }
      }
      return;
    }

    throw new BadRequestException(`Unsupported provider "${provider}"`);
  }

  private toResponseDto(connection: ProviderConnection): ProviderConnectionResponseDto {
    return {
      id: connection.id,
      provider: connection.provider,
      active: connection.active,
      lastSyncedAt: connection.lastSyncedAt,
      lastSyncError: connection.lastSyncError,
      createdAt: connection.createdAt,
    };
  }
}
