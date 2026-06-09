import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AgentRuntimeError } from "./errors.js";
import { parseStructured, stripJsonFence } from "./parse.js";

describe("stripJsonFence", () => {
  it("returns input untouched when no fence", () => {
    expect(stripJsonFence('{"a":1}')).toBe('{"a":1}');
  });
  it("strips ```json fences", () => {
    expect(stripJsonFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
  it("strips plain ``` fences", () => {
    expect(stripJsonFence('```\n{"a":1}\n```')).toBe('{"a":1}');
  });
});

const schema = z.object({ answer: z.string() });

describe("parseStructured", () => {
  it("parses valid JSON with fence", () => {
    expect(parseStructured('```json\n{"answer":"yes"}\n```', schema)).toEqual({ answer: "yes" });
  });
  it("throws parse on invalid JSON", () => {
    try {
      parseStructured("not json", schema);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AgentRuntimeError);
      expect((err as AgentRuntimeError).detail.type).toBe("parse");
    }
  });
  it("throws validate on schema failure", () => {
    try {
      parseStructured('{"answer":42}', schema);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AgentRuntimeError);
      expect((err as AgentRuntimeError).detail.type).toBe("validate");
    }
  });
});
