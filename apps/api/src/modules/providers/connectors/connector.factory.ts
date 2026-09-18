import { Injectable } from "@nestjs/common";
import { Provider } from "@spendguard/shared-types";
import { ProviderConnector } from "./base.connector";
import { OpenAIConnector, OpenAICredentials } from "./openai.connector";
import { AnthropicConnector, AnthropicCredentials } from "./anthropic.connector";
import { GeminiConnector, GeminiCredentials } from "./gemini.connector";

export type ProviderCredentials = OpenAICredentials | AnthropicCredentials | GeminiCredentials;

@Injectable()
export class ConnectorFactory {
  create(provider: Provider, credentials: ProviderCredentials): ProviderConnector {
    switch (provider) {
      case Provider.OpenAI:
        return new OpenAIConnector(credentials as OpenAICredentials);
      case Provider.Anthropic:
        return new AnthropicConnector(credentials as AnthropicCredentials);
      case Provider.Gemini:
        return new GeminiConnector(credentials as GeminiCredentials);
      default:
        throw new Error(`No connector implemented for provider "${provider}"`);
    }
  }
}
