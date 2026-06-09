import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AgentRuntimeError } from "./errors.js";
import { createInvoke } from "./invoke.js";
import { createLoader } from "./loader.js";
import { createToolRegistry } from "./registry.js";
import { createFixtureSupabase } from "./test-fixtures.js";
import type { AgentRow } from "./types.js";

const textRow = {
  name: "writer",
  model: "claude-sonnet-4-5",
  system_instruction: "You write.",
  config: { provider: "anthropic" as const, max_tokens: 100 },
};

const structuredRow = {
  name: "judger",
  model: "claude-sonnet-4-5",
  system_instruction: "You judge.",
  config: { provider: "anthropic" as const, max_tokens: 100 },
};

const toolRow = {
  name: "doer",
  model: "claude-sonnet-4-5",
  system_instruction: "You use tools.",
  config: { provider: "anthropic" as const, max_tokens: 100 },
};

function setupInvoke(rows: AgentRow[], scripted: Array<unknown>) {
  const loader = createLoader({ client: createFixtureSupabase(rows) });
  let calls = 0;
  const provider = {
    async generate() {
      const next = scripted[calls++];
      if (next instanceof Error) throw next;
      return next as Awaited<ReturnType<typeof provider.generate>>;
    },
  };
  const invoke = createInvoke({ loader, providerFor: () => provider });
  return { invoke, getCallCount: () => calls };
}

describe("invoke", () => {
  it("handles a single-turn plain-text agent", async () => {
    const { invoke } = setupInvoke(
      [textRow],
      [
        {
          content: "answer",
          toolCalls: [],
          usage: { input_tokens: 10, output_tokens: 1 },
          raw: { id: "x" },
        },
      ]
    );
    const result = await invoke({ slug: "writer", input: "hi" });
    expect(result.output).toBe("answer");
    expect(result.usage).toEqual({ input_tokens: 10, output_tokens: 1 });
  });

  it("parses a structured-output agent", async () => {
    const schema = z.object({ verdict: z.string() });
    const { invoke } = setupInvoke(
      [structuredRow],
      [
        {
          content: '```json\n{"verdict":"good"}\n```',
          toolCalls: [],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        },
      ]
    );
    const result = await invoke({ slug: "judger", input: "?", schema });
    expect(result.output).toEqual({ verdict: "good" });
  });

  it("loops once when the provider returns a tool call", async () => {
    const registry = createToolRegistry();
    registry.register("echo", {
      description: "echo",
      schema: z.object({ msg: z.string() }),
      handler: async ({ msg }) => ({ echoed: msg }),
    });
    const { invoke, getCallCount } = setupInvoke(
      [toolRow],
      [
        {
          content: "",
          toolCalls: [{ id: "t1", name: "echo", arguments: { msg: "hi" } }],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        },
        {
          content: "done",
          toolCalls: [],
          usage: { input_tokens: 2, output_tokens: 1 },
          raw: null,
        },
      ]
    );
    const result = await invoke({ slug: "doer", input: "go", tools: registry });
    expect(result.output).toBe("done");
    expect(result.usage).toEqual({ input_tokens: 3, output_tokens: 2 });
    expect(getCallCount()).toBe(2);
  });

  it("throws load when slug is missing", async () => {
    const { invoke } = setupInvoke([textRow], []);
    await expect(invoke({ slug: "missing", input: "hi" })).rejects.toMatchObject({
      detail: { type: "load" },
    });
  });

  it("throws parse when structured output is not JSON", async () => {
    const schema = z.object({ verdict: z.string() });
    const { invoke } = setupInvoke(
      [structuredRow],
      [
        {
          content: "not even JSON",
          toolCalls: [],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        },
      ]
    );
    await expect(invoke({ slug: "judger", input: "?", schema })).rejects.toMatchObject({
      detail: { type: "parse" },
    });
  });

  it("throws validate when JSON fails Zod", async () => {
    const schema = z.object({ verdict: z.string() });
    const { invoke } = setupInvoke(
      [structuredRow],
      [
        {
          content: '{"verdict":42}',
          toolCalls: [],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        },
      ]
    );
    await expect(invoke({ slug: "judger", input: "?", schema })).rejects.toMatchObject({
      detail: { type: "validate" },
    });
  });

  it("throws tool when handler throws", async () => {
    const registry = createToolRegistry();
    registry.register("boom", {
      description: "x",
      schema: z.object({}),
      handler: async () => {
        throw new Error("nope");
      },
    });
    const { invoke } = setupInvoke(
      [toolRow],
      [
        {
          content: "",
          toolCalls: [{ id: "t1", name: "boom", arguments: {} }],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        },
      ]
    );
    await expect(
      invoke({ slug: "doer", input: "go", tools: registry })
    ).rejects.toMatchObject({ detail: { type: "tool", name: "boom" } });
  });

  it("throws provider when raw is not exposed and call fails", async () => {
    const { invoke } = setupInvoke([textRow], [new AgentRuntimeError({ type: "provider", cause: new Error("500") })]);
    await expect(invoke({ slug: "writer", input: "hi" })).rejects.toMatchObject({
      detail: { type: "provider" },
    });
  });

  it("retries once on parse error when retryOnParseError is set", async () => {
    const schema = z.object({ verdict: z.string() });
    const { invoke, getCallCount } = setupInvoke(
      [structuredRow],
      [
        {
          content: "not JSON",
          toolCalls: [],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        },
        {
          content: '{"verdict":"ok"}',
          toolCalls: [],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        },
      ]
    );
    const result = await invoke({
      slug: "judger",
      input: "?",
      schema,
      retryOnParseError: true,
    });
    expect(result.output).toEqual({ verdict: "ok" });
    expect(getCallCount()).toBe(2);
  });
});
