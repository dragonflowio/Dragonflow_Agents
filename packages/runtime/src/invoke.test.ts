import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AgentRuntimeError } from "./errors.js";
import { createInvoke } from "./invoke.js";
import { createLoader } from "./loader.js";
import type { Provider, ProviderResponse } from "./providers/types.js";
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

function setupInvoke(rows: AgentRow[], scripted: Array<ProviderResponse | Error>) {
  const loader = createLoader({ client: createFixtureSupabase(rows) });
  let calls = 0;
  const provider: Provider = {
    async generate(): Promise<ProviderResponse> {
      const next = scripted[calls++];
      if (next instanceof Error) throw next;
      if (!next) {
        throw new Error(`No scripted response for call ${calls}`);
      }
      return next;
    },
  };
  const invoke = createInvoke({ loader, providerFor: () => provider });
  return { invoke, getCallCount: () => calls };
}

describe("invoke", () => {
  it("passes config.temperature through to provider.generate when present", async () => {
    const loader = createLoader({
      client: createFixtureSupabase([
        { ...textRow, config: { ...textRow.config, temperature: 0.25 } },
      ]),
    });
    const seen: Array<{ temperature?: number }> = [];
    const provider: Provider = {
      async generate(req) {
        seen.push({ temperature: req.temperature });
        return {
          content: "ok",
          toolCalls: [],
          usage: { input_tokens: 0, output_tokens: 0 },
          raw: {},
        };
      },
    };
    const invoke = createInvoke({ loader, providerFor: () => provider });
    await invoke({ slug: "writer", input: "x" });
    expect(seen[0]!.temperature).toBe(0.25);
  });

  it("omits temperature on provider.generate when row has none", async () => {
    const loader = createLoader({ client: createFixtureSupabase([textRow]) });
    const seen: Array<{ temperature?: number }> = [];
    const provider: Provider = {
      async generate(req) {
        seen.push({ temperature: req.temperature });
        return {
          content: "ok",
          toolCalls: [],
          usage: { input_tokens: 0, output_tokens: 0 },
          raw: {},
        };
      },
    };
    const invoke = createInvoke({ loader, providerFor: () => provider });
    await invoke({ slug: "writer", input: "x" });
    expect(seen[0]!.temperature).toBeUndefined();
  });

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
    expect(result.agent).toEqual({
      name: "writer",
      model: "claude-sonnet-4-5",
      provider: "anthropic",
    });
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

  it("preserves toolCalls on the assistant message echoed back to the provider", async () => {
    // Regression: without toolCalls preserved, Anthropic rejects the next turn
    // with "tool_result has no corresponding tool_use in previous message".
    const registry = createToolRegistry();
    registry.register("echo", {
      description: "echo",
      schema: z.object({ msg: z.string() }),
      handler: async ({ msg }) => ({ echoed: msg }),
    });
    const loader = createLoader({ client: createFixtureSupabase([toolRow]) });
    const seen: Array<ReadonlyArray<unknown>> = [];
    const provider: Provider = {
      async generate(req): Promise<ProviderResponse> {
        seen.push(req.messages.map((m) => ({ ...m })));
        if (seen.length === 1) {
          return {
            content: "thinking…",
            toolCalls: [{ id: "t1", name: "echo", arguments: { msg: "hi" } }],
            usage: { input_tokens: 1, output_tokens: 1 },
            raw: null,
          };
        }
        return {
          content: "done",
          toolCalls: [],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        };
      },
    };
    const invoke = createInvoke({ loader, providerFor: () => provider });
    await invoke({ slug: "doer", input: "go", tools: registry });

    expect(seen).toHaveLength(2);
    const secondCall = seen[1]!;
    expect(secondCall).toHaveLength(3);
    const assistantTurn = secondCall[1] as {
      role: string;
      content: string;
      toolCalls?: Array<{ id: string; name: string }>;
    };
    expect(assistantTurn.role).toBe("assistant");
    expect(assistantTurn.toolCalls).toEqual([
      { id: "t1", name: "echo", arguments: { msg: "hi" } },
    ]);
  });

  it("throws load when slug is missing", async () => {
    const { invoke } = setupInvoke([textRow], []);
    await expect(invoke({ slug: "missing", input: "hi" })).rejects.toMatchObject({
      detail: { type: "load" },
    });
  });

  it("throws parse when structured output is not JSON; usage threaded through", async () => {
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
      detail: { type: "parse", usage: { input_tokens: 1, output_tokens: 1 } },
    });
  });

  it("throws validate when JSON fails Zod; usage threaded through", async () => {
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
      detail: { type: "validate", usage: { input_tokens: 1, output_tokens: 1 } },
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

  it("loads by id when invoke is called with { id }", async () => {
    const rowWithId = {
      ...textRow,
      // FixtureRow accepts an optional id; loader.byId() filters .eq("id", uuid)
      id: "00000000-0000-0000-0000-000000000010",
    } as never;
    const loader = createLoader({ client: createFixtureSupabase([rowWithId]) });
    const provider: Provider = {
      async generate(): Promise<ProviderResponse> {
        return {
          content: "by-id-ok",
          toolCalls: [],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        };
      },
    };
    const invoke = createInvoke({ loader, providerFor: () => provider });
    const result = await invoke({
      id: "00000000-0000-0000-0000-000000000010",
      input: "hi",
    });
    expect(result.output).toBe("by-id-ok");
    expect(result.agent.name).toBe("writer");
  });

  it("throws load when both slug and id are passed", async () => {
    const { invoke } = setupInvoke([textRow], []);
    await expect(
      invoke({ slug: "writer", id: "some-uuid", input: "hi" } as never)
    ).rejects.toMatchObject({ detail: { type: "load" } });
  });

  it("throws load when neither slug nor id is passed", async () => {
    const { invoke } = setupInvoke([textRow], []);
    await expect(invoke({ input: "hi" } as never)).rejects.toMatchObject({
      detail: { type: "load" },
    });
  });

  it("retry: 'json-repair' re-prompts with the bad assistant turn and a correction ask", async () => {
    const schema = z.object({ verdict: z.string() });
    const loader = createLoader({ client: createFixtureSupabase([structuredRow]) });
    const seen: Array<ReadonlyArray<{ role: string; content: string }>> = [];
    let callCount = 0;
    const provider: Provider = {
      async generate(req): Promise<ProviderResponse> {
        seen.push(req.messages.map((m) => ({ role: m.role, content: m.content })));
        callCount++;
        if (callCount === 1) {
          return {
            content: "not even JSON",
            toolCalls: [],
            usage: { input_tokens: 1, output_tokens: 1 },
            raw: null,
          };
        }
        return {
          content: '{"verdict":"recovered"}',
          toolCalls: [],
          usage: { input_tokens: 2, output_tokens: 2 },
          raw: null,
        };
      },
    };
    const invoke = createInvoke({ loader, providerFor: () => provider });
    const result = await invoke({
      slug: "judger",
      input: "?",
      schema,
      retry: "json-repair",
    });
    expect(result.output).toEqual({ verdict: "recovered" });
    expect(callCount).toBe(2);
    // Second call carries the bad assistant turn + a user "Return it corrected." prompt.
    const secondCall = seen[1]!;
    expect(secondCall).toHaveLength(3);
    expect(secondCall[1]!.role).toBe("assistant");
    expect(secondCall[1]!.content).toBe("not even JSON");
    expect(secondCall[2]!.role).toBe("user");
    expect(secondCall[2]!.content).toMatch(/wasn't valid JSON/);
    expect(secondCall[2]!.content).toMatch(/Return it corrected/);
  });

  it("retry: 'json-repair' throws on second failure with accumulated usage", async () => {
    const schema = z.object({ verdict: z.string() });
    const { invoke } = setupInvoke(
      [structuredRow],
      [
        {
          content: "still not JSON",
          toolCalls: [],
          usage: { input_tokens: 1, output_tokens: 1 },
          raw: null,
        },
        {
          content: "also not JSON",
          toolCalls: [],
          usage: { input_tokens: 2, output_tokens: 2 },
          raw: null,
        },
      ]
    );
    await expect(
      invoke({ slug: "judger", input: "?", schema, retry: "json-repair" })
    ).rejects.toMatchObject({
      detail: { type: "parse", usage: { input_tokens: 3, output_tokens: 3 } },
    });
  });

  it("retry: 'none' is the default — no retry on parse failure", async () => {
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
      ]
    );
    await expect(
      invoke({ slug: "judger", input: "?", schema })
    ).rejects.toMatchObject({ detail: { type: "parse" } });
    expect(getCallCount()).toBe(1);
  });

  it("skipLLM: true returns row.config.skip_llm_fixture without calling provider", async () => {
    const rowWithFixture = {
      ...textRow,
      name: "skipper",
      config: { ...textRow.config, skip_llm_fixture: "deterministic-output" },
    };
    const loader = createLoader({ client: createFixtureSupabase([rowWithFixture]) });
    let providerCalls = 0;
    const provider: Provider = {
      async generate(): Promise<ProviderResponse> {
        providerCalls++;
        throw new Error("provider should not be called when skipLLM=true");
      },
    };
    const invoke = createInvoke({
      loader,
      providerFor: () => provider,
      skipLLM: true,
    });
    const result = await invoke({ slug: "skipper", input: "hi" });
    expect(result.output).toBe("deterministic-output");
    expect(result.agent.name).toBe("skipper");
    expect(result.usage).toEqual({ input_tokens: 0, output_tokens: 0 });
    expect(providerCalls).toBe(0);
  });

  it("skipLLM: true throws load when no fixture is set on the row", async () => {
    const loader = createLoader({ client: createFixtureSupabase([textRow]) });
    const provider: Provider = {
      async generate(): Promise<ProviderResponse> {
        throw new Error("not called");
      },
    };
    const invoke = createInvoke({ loader, providerFor: () => provider, skipLLM: true });
    await expect(invoke({ slug: "writer", input: "hi" })).rejects.toMatchObject({
      detail: { type: "load" },
    });
  });

  it("skipLLM: function bypasses provider and is called with row name", async () => {
    const loader = createLoader({ client: createFixtureSupabase([textRow]) });
    let providerCalls = 0;
    const provider: Provider = {
      async generate(): Promise<ProviderResponse> {
        providerCalls++;
        throw new Error("provider should not be called");
      },
    };
    const seenSlugs: string[] = [];
    const invoke = createInvoke({
      loader,
      providerFor: () => provider,
      skipLLM: (slug) => {
        seenSlugs.push(slug);
        return {
          output: "from-function",
          raw: { fixture: true },
          usage: { input_tokens: 0, output_tokens: 0 },
          agent: { name: slug, model: "x", provider: "anthropic" },
        };
      },
    });
    const result = await invoke({ slug: "writer", input: "hi" });
    expect(result.output).toBe("from-function");
    expect(seenSlugs).toEqual(["writer"]);
    expect(providerCalls).toBe(0);
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
