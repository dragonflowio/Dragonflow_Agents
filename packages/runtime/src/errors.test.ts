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

  it("propagates usage through provider/parse/validate variants", () => {
    const provider = serializeError(
      new AgentRuntimeError({ type: "provider", usage: { input_tokens: 7, output_tokens: 2 }, cause: new Error("rate-limited") })
    );
    expect(provider.usage).toEqual({ input_tokens: 7, output_tokens: 2 });

    const parse = serializeError(
      new AgentRuntimeError({ type: "parse", usage: { input_tokens: 3, output_tokens: 4 }, raw: "junk", cause: new Error("nope") })
    );
    expect(parse.usage).toEqual({ input_tokens: 3, output_tokens: 4 });
    expect(parse.raw).toBe("junk");

    const result = z.object({ x: z.string() }).safeParse({ x: 1 });
    if (result.success) throw new Error("expected failure");
    const validate = serializeError(
      new AgentRuntimeError({ type: "validate", usage: { input_tokens: 5, output_tokens: 6 }, raw: { x: 1 }, cause: result.error })
    );
    expect(validate.usage).toEqual({ input_tokens: 5, output_tokens: 6 });
  });

  it("omits usage when not supplied", () => {
    const out = serializeError(
      new AgentRuntimeError({ type: "provider", cause: new Error("oops") })
    );
    expect(out.usage).toBeUndefined();
  });
});
