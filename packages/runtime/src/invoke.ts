import type { ZodTypeAny } from "zod";
import { AgentRuntimeError } from "./errors.js";
import type { AgentLoader } from "./loader.js";
import { parseStructured } from "./parse.js";
import type { Provider } from "./providers/types.js";
import type {
  AgentRow,
  ChatMessage,
  InvokeArgs,
  InvokeInput,
  InvokeResult,
  RegisteredTool,
  ToolRegistry,
  Usage,
} from "./types.js";

const MAX_TOOL_LOOPS = 5;

export type InvokeDeps = {
  loader: AgentLoader;
  providerFor(row: AgentRow): Provider;
};

export function createInvoke(deps: InvokeDeps) {
  return async function invoke<TSchema extends ZodTypeAny | undefined = undefined>(
    args: InvokeArgs<TSchema>
  ): Promise<InvokeResult<TSchema>> {
    const { slug, input, schema, tools, retryOnParseError } = args;
    const signal = args.signal ?? new AbortController().signal;

    const row = await deps.loader.load(slug);
    const provider = deps.providerFor(row);

    const { messages, systemOverride } = resolveInput(input);
    const system = systemOverride ?? row.system_instruction;

    const totalUsage: Usage = { input_tokens: 0, output_tokens: 0 };
    const conversation: ChatMessage[] = [...messages];

    let lastRaw: unknown = null;
    let attemptedParseRetry = false;

    for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
      const response = await provider.generate({
        model: row.model,
        system,
        messages: conversation,
        max_tokens: row.config.max_tokens,
        tools: tools ? listProviderTools(tools) : undefined,
        signal,
      });

      totalUsage.input_tokens += response.usage.input_tokens;
      totalUsage.output_tokens += response.usage.output_tokens;
      lastRaw = response.raw;

      if (response.toolCalls.length > 0) {
        if (!tools) {
          throw new AgentRuntimeError({
            type: "provider",
            cause: new Error(
              `Provider returned tool calls but no tool registry was passed to invoke().`
            ),
          });
        }
        conversation.push({
          role: "assistant",
          content: response.content,
        });
        const results = await Promise.all(
          response.toolCalls.map((call) => runTool(tools, call.name, call.arguments, signal))
        );
        for (let i = 0; i < response.toolCalls.length; i++) {
          const call = response.toolCalls[i]!;
          const result = results[i];
          conversation.push({
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result ?? null),
          });
        }
        continue;
      }

      if (!schema) {
        return {
          output: response.content.trim() as InvokeResult<TSchema>["output"],
          raw: lastRaw,
          usage: totalUsage,
        };
      }

      try {
        const output = parseStructured(response.content, schema);
        return {
          output: output as InvokeResult<TSchema>["output"],
          raw: lastRaw,
          usage: totalUsage,
        };
      } catch (err) {
        if (
          retryOnParseError &&
          !attemptedParseRetry &&
          err instanceof AgentRuntimeError &&
          (err.detail.type === "parse" || err.detail.type === "validate")
        ) {
          attemptedParseRetry = true;
          conversation.push({ role: "assistant", content: response.content });
          conversation.push({
            role: "user",
            content: `Your previous response failed structured-output validation. Error: ${err.message}. Reply again with valid JSON only.`,
          });
          continue;
        }
        throw err;
      }
    }

    throw new AgentRuntimeError({
      type: "provider",
      cause: new Error(`invoke() exceeded MAX_TOOL_LOOPS=${MAX_TOOL_LOOPS} without final answer.`),
    });
  };
}

function resolveInput(input: InvokeInput): {
  messages: ChatMessage[];
  systemOverride: string | undefined;
} {
  if (typeof input === "string") {
    return { messages: [{ role: "user", content: input }], systemOverride: undefined };
  }
  return {
    messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
    systemOverride: input.system,
  };
}

function listProviderTools(registry: ToolRegistry) {
  return registry.list().map(({ name, description }) => {
    const tool = registry.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} listed but not retrievable.`);
    }
    return {
      name: tool.name,
      description,
      schema: zodToJsonSchema(tool.schema),
    };
  });
}

async function runTool(
  registry: ToolRegistry,
  name: string,
  args: unknown,
  signal: AbortSignal
): Promise<unknown> {
  const tool = registry.get(name);
  if (!tool) {
    throw new AgentRuntimeError({
      type: "tool",
      name,
      cause: new Error(`Tool "${name}" is not registered.`),
    });
  }
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    throw new AgentRuntimeError({ type: "tool", name, cause: parsed.error });
  }
  try {
    return await (tool as RegisteredTool).handler(parsed.data, { signal });
  } catch (cause) {
    throw new AgentRuntimeError({ type: "tool", name, cause });
  }
}

function zodToJsonSchema(schema: { _def?: { typeName?: string } } & unknown): Record<string, unknown> {
  // Minimal Zod -> JSON Schema converter for v0.1 (object/string/number/boolean/array
  // primitives and nesting). The contract permits Zod everywhere; this function only
  // exists to project the tool input schema into the provider's tool-spec format.
  // Consumers needing richer JSON Schema features can attach `.openapi(...)` metadata
  // in a future minor (a Plan 4 contract gap, most likely).
  return zodSchemaToJson(schema as ZodSchemaLike);
}

type ZodSchemaLike = {
  _def?: {
    typeName?: string;
    description?: string;
    shape?: () => Record<string, ZodSchemaLike>;
    type?: ZodSchemaLike;
    values?: string[];
    innerType?: ZodSchemaLike;
    valueType?: ZodSchemaLike;
  };
  shape?: Record<string, ZodSchemaLike>;
  description?: string;
};

function zodSchemaToJson(schema: ZodSchemaLike): Record<string, unknown> {
  const def = schema?._def ?? {};
  const description = def.description ?? schema.description;
  const base: Record<string, unknown> = description ? { description } : {};

  switch (def.typeName) {
    case "ZodString":
      return { ...base, type: "string" };
    case "ZodNumber":
      return { ...base, type: "number" };
    case "ZodBoolean":
      return { ...base, type: "boolean" };
    case "ZodNull":
      return { ...base, type: "null" };
    case "ZodArray":
      return {
        ...base,
        type: "array",
        items: def.type ? zodSchemaToJson(def.type) : {},
      };
    case "ZodOptional":
    case "ZodNullable":
      return def.innerType ? zodSchemaToJson(def.innerType) : base;
    case "ZodEnum":
      return { ...base, type: "string", enum: def.values ?? [] };
    case "ZodObject": {
      const shape = def.shape ? def.shape() : (schema.shape ?? {});
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [key, child] of Object.entries(shape)) {
        properties[key] = zodSchemaToJson(child);
        const innerTypeName = child?._def?.typeName;
        if (innerTypeName !== "ZodOptional" && innerTypeName !== "ZodDefault") {
          required.push(key);
        }
      }
      return {
        ...base,
        type: "object",
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties: false,
      };
    }
    case "ZodRecord":
      return {
        ...base,
        type: "object",
        additionalProperties: def.valueType ? zodSchemaToJson(def.valueType) : true,
      };
    default:
      return { ...base, type: "object", additionalProperties: true };
  }
}
