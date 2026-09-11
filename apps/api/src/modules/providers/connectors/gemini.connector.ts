import { ProviderConnector } from "./base.connector";

export class GeminiConnector implements ProviderConnector {
  async fetchUsage(since: Date) {
    // TODO: call Google Gemini usage API
    return [];
  }
}
