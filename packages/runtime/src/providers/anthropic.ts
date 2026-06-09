import { AgentRuntimeError } from "../errors.js";
import type { Provider, ProviderEnv, ProviderRequest, ProviderResponse } from "./types.js";

export function createAnthropicProvider(env: ProviderEnv): Provider {
  return {
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      const apiKey = env.apiKey ?? process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new AgentRuntimeError({
          type: "provider",
          cause: new Error("ANTHROPIC_API_KEY is not set."),
        });
      }

      const body = {
        model: req.model,
        max_tokens: req.max_tokens,
        ...(typeof req.temperature === "number" ? { temperature: req.temperature } : {}),
        system: req.system || undefined,
        messages: toAnthropicMessages(req.messages),
        ...(req.tools?.length
          ? {
              tools: req.tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                input_schema: tool.schema,
              })),
            }
          : {}),
      };

      let response: Response;
      try {
        response = await env.fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "x-api-key": apiKey,
          },
          body: JSON.stringify(body),
          signal: req.signal,
        });
      } catch (thrown) {
        throw new AgentRuntimeError({ type: "provider", cause: thrown });
      }

      if (!response.ok) {
        const detail = await safeReadText(response);
        throw new AgentRuntimeError({
          type: "provider",
          cause: new Error(`Anthropic ${response.status}: ${detail}`),
        });
      }

      const payload = (await response.json()) as AnthropicResponse;
      const content = extractText(payload);
      const toolCalls = extractToolCalls(payload);

      return {
        content,
        toolCalls,
        usage: {
          input_tokens: payload.usage?.input_tokens ?? 0,
          output_tokens: payload.usage?.output_tokens ?? 0,
        },
        raw: payload,
      };
    },
  };
}

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: string; [key: string]: unknown };

type AnthropicResponse = {
  content?: AnthropicContentBlock[];
  usage?: { input_tokens?: number; output_tokens?: number };
};

function extractText(payload: AnthropicResponse): string {
  const blocks = payload.content ?? [];
  return blocks
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function extractToolCalls(payload: AnthropicResponse) {
  const blocks = payload.content ?? [];
  return blocks
    .filter(
      (block): block is { type: "tool_use"; id: string; name: string; input: unknown } =>
        block.type === "tool_use"
    )
    .map((block) => ({ id: block.id, name: block.name, arguments: block.input ?? {} }));
}

function toAnthropicMessages(messages: ProviderRequest["messages"]) {
  const out: Array<{ role: "user" | "assistant"; content: unknown }> = [];
  for (const message of messages) {
    if (message.role === "tool") {
      out.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: message.tool_call_id,
            content: message.content,
          },
        ],
      });
      continue;
    }
    if (message.role === "assistant" && message.toolCalls?.length) {
      const blocks: Array<Record<string, unknown>> = [];
      if (message.content) {
        blocks.push({ type: "text", text: message.content });
      }
      for (const call of message.toolCalls) {
        blocks.push({
          type: "tool_use",
          id: call.id,
          name: call.name,
          input: call.arguments,
        });
      }
      out.push({ role: "assistant", content: blocks });
      continue;
    }
    out.push({ role: message.role, content: message.content });
  }
  return out;
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "(no body)";
  }
}
