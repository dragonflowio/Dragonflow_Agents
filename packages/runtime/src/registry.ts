import type { ZodTypeAny } from "zod";
import type {
  RegisteredTool,
  ToolHandler,
  ToolRegistry,
  ToolSpec,
} from "./types.js";

export function createToolRegistry(): ToolRegistry {
  const tools = new Map<string, RegisteredTool>();

  return {
    register<TSchema extends ZodTypeAny, TOutput>(
      name: string,
      spec: ToolSpec<TSchema, TOutput>
    ): void {
      if (!name || typeof name !== "string") {
        throw new Error("Tool name must be a non-empty string.");
      }
      if (tools.has(name)) {
        throw new Error(`Tool "${name}" is already registered.`);
      }
      tools.set(name, {
        name,
        description: spec.description,
        schema: spec.schema,
        handler: spec.handler as ToolHandler<unknown, unknown>,
      });
    },
    list() {
      return [...tools.values()].map(({ name, description }) => ({
        name,
        description,
      }));
    },
    get(name: string) {
      return tools.get(name);
    },
  };
}
