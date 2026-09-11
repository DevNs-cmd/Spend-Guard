import { ProviderConnector } from "./base.connector";

export class AnthropicConnector implements ProviderConnector {
  async fetchUsage(since: Date) {
    // TODO: call Anthropic usage API
    return [];
  }
}
