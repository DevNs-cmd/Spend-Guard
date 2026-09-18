import { Provider } from "@spendguard/shared-types";

// Body shape for POST /providers. The `credentials` shape depends on
// `provider` — validated in providers.service.ts before encrypting.
export class ConnectProviderDto {
  provider: Provider;
  credentials:
    | { adminApiKey: string } // openai / anthropic
    | {
        gcpProjectId: string;
        billingExportDataset: string;
        billingExportTable: string;
        serviceAccountJson: string;
      }; // gemini
}
