import type { ZodError } from "zod";

export type RuntimeError =
  | { type: "load"; slug: string; cause: unknown }
  | { type: "provider"; cause: unknown }
  | { type: "parse"; raw: string; cause: unknown }
  | { type: "validate"; raw: unknown; cause: ZodError }
  | { type: "tool"; name: string; cause: unknown };

export class AgentRuntimeError extends Error {
  readonly detail: RuntimeError;

  constructor(detail: RuntimeError) {
    super(formatMessage(detail));
    this.name = "AgentRuntimeError";
    this.detail = detail;
  }
}

function formatMessage(detail: RuntimeError): string {
  switch (detail.type) {
    case "load":
      return `agent-runtime: load failed for slug "${detail.slug}"`;
    case "provider":
      return `agent-runtime: provider call failed`;
    case "parse":
      return `agent-runtime: structured output could not be JSON-parsed`;
    case "validate":
      return `agent-runtime: structured output failed schema validation`;
    case "tool":
      return `agent-runtime: tool handler "${detail.name}" threw`;
  }
}

export type SerializedRuntimeError = {
  type: RuntimeError["type"];
  message: string;
  slug?: string;
  name?: string;
  raw?: unknown;
  cause?: { message: string; stack?: string } | string;
};

export function serializeError(err: unknown): SerializedRuntimeError {
  const detail = err instanceof AgentRuntimeError ? err.detail : toUnknownDetail(err);
  const cause = serializeCause(detail.cause);

  switch (detail.type) {
    case "load":
      return { type: detail.type, message: formatMessage(detail), slug: detail.slug, cause };
    case "provider":
      return { type: detail.type, message: formatMessage(detail), cause };
    case "parse":
      return { type: detail.type, message: formatMessage(detail), raw: detail.raw, cause };
    case "validate":
      return { type: detail.type, message: formatMessage(detail), raw: detail.raw, cause };
    case "tool":
      return { type: detail.type, message: formatMessage(detail), name: detail.name, cause };
  }
}

function toUnknownDetail(err: unknown): RuntimeError {
  return { type: "provider", cause: err };
}

function serializeCause(cause: unknown): SerializedRuntimeError["cause"] {
  if (cause instanceof Error) {
    return { message: cause.message, stack: cause.stack };
  }
  if (typeof cause === "string") {
    return cause;
  }
  try {
    return { message: JSON.stringify(cause) };
  } catch {
    return { message: String(cause) };
  }
}
