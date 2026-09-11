import { ProviderConnector } from "./base.connector";

export class OpenAIConnector implements ProviderConnector {
  async fetchUsage(since: Date) {
    // TODO: call OpenAI usage/billing API
    return [];
  }
}
