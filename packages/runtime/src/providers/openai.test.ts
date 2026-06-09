import { describe, expect, it } from "vitest";
import { createOpenAIProvider } from "./openai.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}

describe("createOpenAIProvider", () => {
  it("sends Authorization header and parses content", async () => {
    let seen: RequestInit | undefined;
    const provider = createOpenAIProvider({
      apiKey: "sk-x",
      fetch: async (_url, init) => {
        seen = init as RequestInit;
        return jsonResponse({
          choices: [{ message: { content: "hello", tool_calls: undefined } }],
          usage: { prompt_tokens: 10, completion_tokens: 4 },
        });
      },
    });
    const out = await provider.generate({
      model: "gpt-4o",
      system: "be helpful",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 100,
    });
    expect(out.content).toBe("hello");
    expect(out.usage).toEqual({ input_tokens: 10, output_tokens: 4 });
    expect((seen?.headers as Record<string, string>).Authorization).toBe("Bearer sk-x");
    const body = JSON.parse(seen!.body as string);
    expect(body.messages[0]).toEqual({ role: "system", content: "be helpful" });
    expect(body.messages[1]).toEqual({ role: "user", content: "hi" });
  });

  it("forwards temperature when provided and omits it when undefined", async () => {
    let withBody: Record<string, unknown> | undefined;
    let withoutBody: Record<string, unknown> | undefined;
    const provider = createOpenAIProvider({
      apiKey: "k",
      fetch: async (_url, init) => {
        const body = JSON.parse((init as RequestInit).body as string);
        if (body.temperature !== undefined) withBody = body;
        else withoutBody = body;
        return jsonResponse({
          choices: [{ message: { content: "ok", tool_calls: undefined } }],
          usage: { prompt_tokens: 0, completion_tokens: 0 },
        });
      },
    });
    await provider.generate({
      model: "gpt-4o",
      system: "",
      messages: [{ role: "user", content: "x" }],
      max_tokens: 10,
      temperature: 0.2,
    });
    await provider.generate({
      model: "gpt-4o",
      system: "",
      messages: [{ role: "user", content: "x" }],
      max_tokens: 10,
    });
    expect(withBody?.temperature).toBe(0.2);
    expect(withoutBody && "temperature" in withoutBody).toBe(false);
  });

  it("parses tool calls + JSON arguments", async () => {
    const provider = createOpenAIProvider({
      apiKey: "k",
      fetch: async () =>
        jsonResponse({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function",
                    function: { name: "do_thing", arguments: '{"x":1}' },
                  },
                ],
              },
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
    });
    const out = await provider.generate({
      model: "gpt-4o",
      system: "",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 1,
    });
    expect(out.content).toBe("");
    expect(out.toolCalls).toEqual([
      { id: "call_1", name: "do_thing", arguments: { x: 1 } },
    ]);
  });
});
