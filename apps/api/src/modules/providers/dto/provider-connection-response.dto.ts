import { Provider } from "@spendguard/shared-types";

// What GET/POST /providers actually returns — NEVER include credentials here.
export class ProviderConnectionResponseDto {
  id: string;
  provider: Provider;
  active: boolean;
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
  createdAt: Date;
}
