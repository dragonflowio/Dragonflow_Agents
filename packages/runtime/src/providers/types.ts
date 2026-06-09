import type { ChatMessage, ProviderToolCall, Usage } from "../types.js";

export type ProviderToolSpec = {
  name: string;
  description: string;
  schema: Record<string, unknown>;
};

export type ProviderRequest = {
  model: string;
  system: string;
  messages: ChatMessage[];
  max_tokens: number;
  temperature?: number;
  tools?: ProviderToolSpec[];
  signal?: AbortSignal;
};

export type ProviderResponse = {
  content: string;
  toolCalls: ProviderToolCall[];
  usage: Usage;
  raw: unknown;
};

export interface Provider {
  generate(req: ProviderRequest): Promise<ProviderResponse>;
}

export type ProviderEnv = {
  fetch: typeof fetch;
  apiKey?: string;
};
