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
  /**
   * Optional deterministic fixture returned when the runtime is created with
   * `skipLLM: true` and no per-slug bypass function. String for unstructured
   * agents, an already-validated object for structured ones.
   */
  skip_llm_fixture?: unknown;
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

/**
 * Retry policy for structured-output parse / validate failures.
 *
 * - `'none'` — fail fast on first parse error (default).
 * - `'reprompt-with-error'` — re-prompt once with the error message appended.
 *   `retryOnParseError: true` maps here at the boundary.
 * - `'json-repair'` — re-prompt once with the bad assistant turn echoed back
 *   and a user turn asking for it corrected ("That wasn't valid JSON ($error).
 *   Return it corrected."). Pattern surfaced by Titos-Inventario's drafter.
 *
 * Resolution: `retry` wins when set; otherwise `retryOnParseError` maps as above.
 */
export type RetryPolicy = "none" | "reprompt-with-error" | "json-repair";

/**
 * Exactly one of `slug` or `id` must be set. Both-set or neither-set throws
 * `AgentRuntimeError({ type: "load" })` at invoke time.
 */
export type InvokeArgs<TSchema extends ZodTypeAny | undefined = undefined> = {
  slug?: string;
  id?: string;
  input: InvokeInput;
  schema?: TSchema;
  tools?: ToolRegistry;
  signal?: AbortSignal;
  /** 0.2.x boundary — still accepted; mapped to `retry` if `retry` is unset. */
  retryOnParseError?: boolean;
  retry?: RetryPolicy;
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

/**
 * `skipLLM` deterministic-bypass hatch (surface added in 0.3.0).
 *
 * - `true` — boolean mode. The runtime returns `row.config.skip_llm_fixture`
 *   as the output without calling the provider. An unset fixture throws
 *   `AgentRuntimeError({ type: "load" })` directing the consumer to register
 *   a function bypass or set the fixture.
 * - A function — consumer-controlled per-slug bypass. Called with the loaded
 *   row's `name`; its return value is the `InvokeResult` (the runtime trusts
 *   the consumer to return a shape compatible with the call site's schema).
 *
 * When the constructor doesn't pass `skipLLM`, the runtime picks up
 * `process.env.SKIP_LLM === '1'` as boolean mode — matches Titos-Inventario's
 * existing env-var hatch so adopters migrating off it don't change env names.
 */
export type SkipLLMOption =
  | boolean
  | ((slug: string) => InvokeResult<ZodTypeAny | undefined>);
