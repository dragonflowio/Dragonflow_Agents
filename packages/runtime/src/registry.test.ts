import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createToolRegistry } from "./registry.js";

describe("createToolRegistry", () => {
  it("registers and lists tools", () => {
    const registry = createToolRegistry();
    registry.register("get_weather", {
      description: "Look up the weather.",
      schema: z.object({ city: z.string() }),
      handler: async ({ city }) => ({ city, temp: 70 }),
    });

    expect(registry.list()).toEqual([
      { name: "get_weather", description: "Look up the weather." },
    ]);
    expect(registry.get("get_weather")?.name).toBe("get_weather");
  });

  it("rejects duplicate registration", () => {
    const registry = createToolRegistry();
    registry.register("tool", {
      description: "x",
      schema: z.object({}),
      handler: async () => null,
    });
    expect(() =>
      registry.register("tool", {
        description: "y",
        schema: z.object({}),
        handler: async () => null,
      })
    ).toThrow(/already registered/);
  });

  it("rejects empty names", () => {
    const registry = createToolRegistry();
    expect(() =>
      registry.register("", {
        description: "x",
        schema: z.object({}),
        handler: async () => null,
      })
    ).toThrow(/non-empty/);
  });
});
