import { AgentRuntimeError } from "../errors.js";
import type { Provider, ProviderEnv, ProviderRequest, ProviderResponse } from "./types.js";

export function createGoogleProvider(env: ProviderEnv): Provider {
  return {
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      const apiKey = env.apiKey ?? process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new AgentRuntimeError({
          type: "provider",
          cause: new Error("GOOGLE_API_KEY is not set."),
        });
      }

      const body = {
        systemInstruction: req.system
          ? { role: "system", parts: [{ text: req.system }] }
          : undefined,
        contents: toGoogleContents(req.messages),
        generationConfig: { maxOutputTokens: req.max_tokens },
        ...(req.tools?.length
          ? {
              tools: [
                {
                  functionDeclarations: req.tools.map((tool) => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.schema,
                  })),
                },
              ],
            }
          : {}),
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        req.model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      let response: Response;
      try {
        response = await env.fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          cause: new Error(`Google ${response.status}: ${detail}`),
        });
      }

      const payload = (await response.json()) as GoogleResponse;
      const parts = payload.candidates?.[0]?.content?.parts ?? [];
      const content = parts
        .map((part) => {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        })
        .join("");
      const toolCalls = parts
        .filter(
          (part): part is GoogleFunctionCallPart => "functionCall" in part && !!part.functionCall
        )
        .map((part, index) => ({
          id: `google-tool-${index}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args ?? {},
        }));

      return {
        content,
        toolCalls,
        usage: {
          input_tokens: payload.usageMetadata?.promptTokenCount ?? 0,
          output_tokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
        },
        raw: payload,
      };
    },
  };
}

type GoogleFunctionCallPart = {
  functionCall: { name: string; args?: unknown };
};

type GooglePart =
  | { text?: string }
  | GoogleFunctionCallPart
  | Record<string, unknown>;

type GoogleResponse = {
  candidates?: Array<{ content?: { parts?: GooglePart[] } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

function toGoogleContents(messages: ProviderRequest["messages"]) {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "user",
        parts: [
          {
            functionResponse: {
              name: message.tool_call_id,
              response: { content: message.content },
            },
          },
        ],
      };
    }
    if (message.role === "assistant" && message.toolCalls?.length) {
      const parts: Array<Record<string, unknown>> = [];
      if (message.content) {
        parts.push({ text: message.content });
      }
      for (const call of message.toolCalls) {
        parts.push({
          functionCall: {
            name: call.name,
            args: call.arguments ?? {},
          },
        });
      }
      return { role: "model", parts };
    }
    return {
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    };
  });
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "(no body)";
  }
}
