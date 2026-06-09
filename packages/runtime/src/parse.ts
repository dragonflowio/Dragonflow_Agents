import type { ZodTypeAny } from "zod";
import { AgentRuntimeError } from "./errors.js";

const FENCE_RE = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;

export function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const match = FENCE_RE.exec(trimmed);
  return match && match[1] !== undefined ? match[1].trim() : trimmed;
}

export function parseStructured<TSchema extends ZodTypeAny>(
  raw: string,
  schema: TSchema
): ReturnType<TSchema["parse"]> {
  const cleaned = stripJsonFence(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (cause) {
    throw new AgentRuntimeError({ type: "parse", raw, cause });
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new AgentRuntimeError({ type: "validate", raw: parsed, cause: result.error });
  }
  return result.data;
}
