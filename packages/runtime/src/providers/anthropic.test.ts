import { describe, expect, it } from "vitest";
import { AgentRuntimeError } from "../errors.js";
import { createAnthropicProvider } from "./anthropic.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

describe("createAnthropicProvider", () => {
  it("posts the expected body and parses text content + usage", async () => {
    const seenRequest: { url?: string; init?: RequestInit } = {};
    const provider = createAnthropicProvider({
      apiKey: "k",
      fetch: async (url, init) => {
        seenRequest.url = url as string;
        seenRequest.init = init as RequestInit;
        return jsonResponse({
          content: [{ type: "text", text: "Hello." }],
          usage: { input_tokens: 5, output_tokens: 3 },
        });
      },
    });

    const out = await provider.generate({
      model: "claude-sonnet-4-5",
      system: "be helpful",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 64,
    });

    expect(out.content).toBe("Hello.");
    expect(out.usage).toEqual({ input_tokens: 5, output_tokens: 3 });
    expect(out.toolCalls).toEqual([]);

    expect(seenRequest.url).toBe("https://api.anthropic.com/v1/messages");
    const body = JSON.parse(seenRequest.init!.body as string);
    expect(body.model).toBe("claude-sonnet-4-5");
    expect(body.max_tokens).toBe(64);
    expect(body.system).toBe("be helpful");
    expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
    expect((seenRequest.init!.headers as Record<string, string>)["x-api-key"]).toBe("k");
  });

  it("extracts tool_use blocks", async () => {
    const provider = createAnthropicProvider({
      apiKey: "k",
      fetch: async () =>
        jsonResponse({
          content: [
            { type: "text", text: "Calling tool." },
            { type: "tool_use", id: "t_1", name: "lookup", input: { id: "abc" } },
          ],
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
    });
    const out = await provider.generate({
      model: "m",
      system: "",
      messages: [{ role: "user", content: "x" }],
      max_tokens: 10,
    });
    expect(out.toolCalls).toEqual([{ id: "t_1", name: "lookup", arguments: { id: "abc" } }]);
  });

  it("reconstructs tool_use blocks when echoing an assistant turn that called tools", async () => {
    // Regression: when invoke() pushes the assistant message back after a
    // tool call, the provider must serialize the previous tool_use blocks
    // alongside the text. Otherwise the next tool_result is orphaned and
    // Anthropic returns 400.
    const seenRequest: { init?: RequestInit } = {};
    const provider = createAnthropicProvider({
      apiKey: "k",
      fetch: async (_url, init) => {
        seenRequest.init = init as RequestInit;
        return jsonResponse({
          content: [{ type: "text", text: "done" }],
          usage: { input_tokens: 1, output_tokens: 1 },
        });
      },
    });
    await provider.generate({
      model: "m",
      system: "",
      messages: [
        { role: "user", content: "go" },
        {
          role: "assistant",
          content: "thinking…",
          toolCalls: [{ id: "t_1", name: "lookup", arguments: { id: "abc" } }],
        },
        { role: "tool", tool_call_id: "t_1", content: '{"ok":true}' },
      ],
      max_tokens: 10,
    });
    const body = JSON.parse(seenRequest.init!.body as string);
    expect(body.messages).toEqual([
      { role: "user", content: "go" },
      {
        role: "assistant",
        content: [
          { type: "text", text: "thinking…" },
          { type: "tool_use", id: "t_1", name: "lookup", input: { id: "abc" } },
        ],
      },
      {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "t_1", content: '{"ok":true}' }],
      },
    ]);
  });

  it("throws provider on non-200", async () => {
    const provider = createAnthropicProvider({
      apiKey: "k",
      fetch: async () => jsonResponse({ error: { message: "nope" } }, { status: 500 }),
    });
    await expect(
      provider.generate({
        model: "m",
        system: "",
        messages: [{ role: "user", content: "x" }],
        max_tokens: 10,
      })
    ).rejects.toMatchObject({
      detail: { type: "provider" },
    });
  });

  it("throws provider when API key missing", async () => {
    const provider = createAnthropicProvider({
      fetch: async () => jsonResponse({}),
    });
    delete process.env.ANTHROPIC_API_KEY;
    await expect(
      provider.generate({
        model: "m",
        system: "",
        messages: [{ role: "user", content: "x" }],
        max_tokens: 10,
      })
    ).rejects.toBeInstanceOf(AgentRuntimeError);
  });
});
