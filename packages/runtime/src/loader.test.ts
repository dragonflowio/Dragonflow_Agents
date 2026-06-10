import { describe, expect, it } from "vitest";
import { AgentRuntimeError } from "./errors.js";
import { createLoader } from "./loader.js";
import { createFixtureSupabase } from "./test-fixtures.js";

const valid = {
  name: "summarize",
  model: "claude-sonnet-4-5",
  system_instruction: "You summarize text.",
  config: { provider: "anthropic" as const, max_tokens: 1024 },
};

describe("createLoader", () => {
  it("loads a row by slug", async () => {
    const loader = createLoader({ client: createFixtureSupabase([valid]) });
    const row = await loader.load("summarize");
    expect(row.model).toBe("claude-sonnet-4-5");
    expect(row.config.provider).toBe("anthropic");
    expect(row.config.max_tokens).toBe(1024);
  });

  it("throws load on missing slug", async () => {
    const loader = createLoader({ client: createFixtureSupabase([valid]) });
    await expect(loader.load("missing")).rejects.toMatchObject({
      name: "AgentRuntimeError",
      detail: { type: "load", slug: "missing" },
    });
  });

  it("throws load when row is missing model", async () => {
    const loader = createLoader({
      client: createFixtureSupabase([
        {
          name: "broken",
          system_instruction: "x",
          config: { provider: "anthropic", max_tokens: 100 },
        } as never,
      ]),
    });
    await expect(loader.load("broken")).rejects.toBeInstanceOf(AgentRuntimeError);
  });

  it("accepts optional config.temperature and surfaces it on the row", async () => {
    const loader = createLoader({
      client: createFixtureSupabase([
        { ...valid, name: "warm", config: { ...valid.config, temperature: 0.2 } },
      ]),
    });
    const row = await loader.load("warm");
    expect(row.config.temperature).toBe(0.2);
  });

  it("rejects invalid config.temperature (non-number or negative)", async () => {
    const loader = createLoader({
      client: createFixtureSupabase([
        {
          ...valid,
          name: "bad-temp",
          config: { ...valid.config, temperature: "warm" as never },
        },
      ]),
    });
    await expect(loader.load("bad-temp")).rejects.toMatchObject({
      detail: { type: "load" },
    });
  });

  it("throws load when config.provider is invalid", async () => {
    const loader = createLoader({
      client: createFixtureSupabase([
        {
          ...valid,
          name: "wrong-provider",
          config: { provider: "openrouter" as never, max_tokens: 100 },
        },
      ]),
    });
    await expect(loader.load("wrong-provider")).rejects.toMatchObject({
      detail: { type: "load" },
    });
  });

  it("byId loads a row by uuid", async () => {
    const loader = createLoader({
      client: createFixtureSupabase([
        { ...valid, id: "00000000-0000-0000-0000-000000000001" },
      ]),
    });
    const row = await loader.byId("00000000-0000-0000-0000-000000000001");
    expect(row.name).toBe("summarize");
    expect(row.model).toBe("claude-sonnet-4-5");
  });

  it("byId throws load when id is missing", async () => {
    const loader = createLoader({
      client: createFixtureSupabase([
        { ...valid, id: "00000000-0000-0000-0000-000000000001" },
      ]),
    });
    await expect(loader.byId("99999999-9999-9999-9999-999999999999")).rejects.toMatchObject({
      name: "AgentRuntimeError",
      detail: { type: "load" },
    });
  });

  it("byId and byName cache slots are independent (no cross-contamination)", async () => {
    let calls = 0;
    const client = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async single() {
            calls += 1;
            return { data: valid, error: null };
          },
        };
      },
    } as never;
    const loader = createLoader({ client, cache: { ttlMs: 5000 } });
    await loader.byName("summarize");
    await loader.byName("summarize");
    expect(calls).toBe(1);
    await loader.byId("summarize"); // same key, different mode → second hit
    expect(calls).toBe(2);
    await loader.byId("summarize");
    expect(calls).toBe(2);
  });

  it("load is an alias for byName (0.2.x consumers keep working)", async () => {
    const loader = createLoader({ client: createFixtureSupabase([valid]) });
    const a = await loader.load("summarize");
    const b = await loader.byName("summarize");
    expect(a).toEqual(b);
  });

  it("caches within TTL", async () => {
    let calls = 0;
    const client = {
      from() {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async single() {
            calls += 1;
            return { data: valid, error: null };
          },
        };
      },
    } as never;
    let nowValue = 1000;
    const loader = createLoader({
      client,
      cache: { ttlMs: 5000 },
      now: () => nowValue,
    });
    await loader.load("summarize");
    await loader.load("summarize");
    expect(calls).toBe(1);
    nowValue += 6000;
    await loader.load("summarize");
    expect(calls).toBe(2);
  });
});
