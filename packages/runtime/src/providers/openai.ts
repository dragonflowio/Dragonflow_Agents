import { AgentRuntimeError } from "../errors.js";
import type { Provider, ProviderEnv, ProviderRequest, ProviderResponse } from "./types.js";

export function createOpenAIProvider(env: ProviderEnv): Provider {
  return {
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      const apiKey = env.apiKey ?? process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new AgentRuntimeError({
          type: "provider",
          cause: new Error("OPENAI_API_KEY is not set."),
        });
      }

      const messages = toOpenAIMessages(req);
      const body = {
        model: req.model,
        max_tokens: req.max_tokens,
        messages,
        ...(req.tools?.length
          ? {
              tools: req.tools.map((tool) => ({
                type: "function" as const,
                function: {
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.schema,
                },
              })),
            }
          : {}),
      };

      let response: Response;
      try {
        response = await env.fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
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
          cause: new Error(`OpenAI ${response.status}: ${detail}`),
        });
      }

      const payload = (await response.json()) as OpenAIResponse;
      const choice = payload.choices?.[0];
      const message = choice?.message ?? { content: "", tool_calls: undefined };

      return {
        content: message.content ?? "",
        toolCalls: (message.tool_calls ?? []).map((call) => ({
          id: call.id,
          name: call.function.name,
          arguments: parseToolArgs(call.function.arguments),
        })),
        usage: {
          input_tokens: payload.usage?.prompt_tokens ?? 0,
          output_tokens: payload.usage?.completion_tokens ?? 0,
        },
        raw: payload,
      };
    },
  };
}

type OpenAIToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type OpenAIMessage = {
  content: string | null;
  tool_calls?: OpenAIToolCall[];
};

type OpenAIResponse = {
  choices?: Array<{ message: OpenAIMessage }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

function toOpenAIMessages(req: ProviderRequest) {
  const out: Array<Record<string, unknown>> = [];
  if (req.system) {
    out.push({ role: "system", content: req.system });
  }
  for (const message of req.messages) {
    if (message.role === "tool") {
      out.push({
        role: "tool",
        tool_call_id: message.tool_call_id,
        content: message.content,
      });
      continue;
    }
    if (message.role === "assistant" && message.toolCalls?.length) {
      out.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: "function",
          function: {
            name: call.name,
            arguments:
              typeof call.arguments === "string"
                ? call.arguments
                : JSON.stringify(call.arguments ?? {}),
          },
        })),
      });
      continue;
    }
    out.push({ role: message.role, content: message.content });
  }
  return out;
}

function parseToolArgs(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "(no body)";
  }
}
