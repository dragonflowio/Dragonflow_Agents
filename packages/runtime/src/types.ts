import type { z, ZodTypeAny } from "zod";

export type AgentProvider = "anthropic" | "google" | "openai";

export type AgentRow = {
  name: string;
  model: string;
  system_instruction: string;
  config: AgentRowConfig;
};

export type AgentRowConfig = {
  provider: AgentProvider;
  max_tokens: number;
  temperature?: number;
  [key: string]: unknown;
};

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: ProviderToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type InvokeInput =
  | string
  | {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      system?: string;
    };

export type ToolContext = {
  signal: AbortSignal;
};

export type ToolHandler<TInput, TOutput> = (
  input: TInput,
  ctx: ToolContext
) => Promise<TOutput>;

export type ToolSpec<TSchema extends ZodTypeAny, TOutput> = {
  description: string;
  schema: TSchema;
  handler: ToolHandler<z.infer<TSchema>, TOutput>;
};

export type RegisteredTool = {
  name: string;
  description: string;
  schema: ZodTypeAny;
  handler: ToolHandler<unknown, unknown>;
};

export interface ToolRegistry {
  register<TSchema extends ZodTypeAny, TOutput>(
    name: string,
    spec: ToolSpec<TSchema, TOutput>
  ): void;
  list(): Array<{ name: string; description: string }>;
  get(name: string): RegisteredTool | undefined;
}

export type Usage = {
  input_tokens: number;
  output_tokens: number;
};

export type ProviderToolCall = {
  id: string;
  name: string;
  arguments: unknown;
};

export type ProviderRawResponse = unknown;

export type InvokeArgs<TSchema extends ZodTypeAny | undefined = undefined> = {
  slug: string;
  input: InvokeInput;
  schema?: TSchema;
  tools?: ToolRegistry;
  signal?: AbortSignal;
  retryOnParseError?: boolean;
};

export type InvokeAgentSummary = {
  name: string;
  model: string;
  provider: AgentProvider;
};

export type InvokeResult<TSchema extends ZodTypeAny | undefined> = {
  output: TSchema extends ZodTypeAny ? z.infer<TSchema> : string;
  raw: ProviderRawResponse;
  usage: Usage;
  agent: InvokeAgentSummary;
};
