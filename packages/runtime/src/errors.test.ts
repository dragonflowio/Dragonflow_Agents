import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AgentRuntimeError, serializeError } from "./errors.js";

describe("AgentRuntimeError", () => {
  it("serializes a load error", () => {
    const err = new AgentRuntimeError({ type: "load", slug: "x", cause: new Error("boom") });
    const out = serializeError(err);
    expect(out.type).toBe("load");
    expect(out.slug).toBe("x");
    expect(out.message).toMatch(/load failed/);
  });

  it("serializes a validate error with a ZodError cause", () => {
    const result = z.object({ x: z.string() }).safeParse({ x: 1 });
    if (result.success) throw new Error("expected failure");
    const err = new AgentRuntimeError({ type: "validate", raw: { x: 1 }, cause: result.error });
    const out = serializeError(err);
    expect(out.type).toBe("validate");
    expect(out.raw).toEqual({ x: 1 });
  });

  it("serializes unknown errors as provider", () => {
    const out = serializeError(new Error("network broke"));
    expect(out.type).toBe("provider");
  });
});
