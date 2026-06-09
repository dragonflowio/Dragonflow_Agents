import type { AgentProvider } from "../types.js";
import { createAnthropicProvider } from "./anthropic.js";
import { createGoogleProvider } from "./google.js";
import { createOpenAIProvider } from "./openai.js";
import type { Provider, ProviderEnv } from "./types.js";

export type { Provider, ProviderEnv, ProviderRequest, ProviderResponse, ProviderToolSpec } from "./types.js";

export function createProvider(name: AgentProvider, env: ProviderEnv): Provider {
  switch (name) {
    case "anthropic":
      return createAnthropicProvider(env);
    case "google":
      return createGoogleProvider(env);
    case "openai":
      return createOpenAIProvider(env);
  }
}
