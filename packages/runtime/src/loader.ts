import type { SupabaseClient } from "@supabase/supabase-js";
import { AgentRuntimeError } from "./errors.js";
import type { AgentRow, AgentRowConfig } from "./types.js";

export type LoaderOptions = {
  client: SupabaseClient;
  cache?: { ttlMs: number };
  now?: () => number;
};

export type AgentLoader = {
  /**
   * Load an agent row by its `name` column (the slug). 0.2.x surface — preserved.
   * Equivalent to `byName(slug)`.
   */
  load(slug: string): Promise<AgentRow>;
  byName(slug: string): Promise<AgentRow>;
  byId(id: string): Promise<AgentRow>;
};

type CacheEntry = { row: AgentRow; expiresAt: number };
type LookupMode = "name" | "id";

export function createLoader(opts: LoaderOptions): AgentLoader {
  const { client, cache, now = () => Date.now() } = opts;
  const memo = new Map<string, CacheEntry>();

  async function loadBy(mode: LookupMode, key: string): Promise<AgentRow> {
    const cacheKey = `${mode}:${key}`;
    if (cache) {
      const hit = memo.get(cacheKey);
      if (hit && hit.expiresAt > now()) {
        return hit.row;
      }
    }

    let data: unknown;
    let error: unknown;
    try {
      const result = await client
        .from("agents")
        .select("name, model, system_instruction, config")
        .eq(mode === "name" ? "name" : "id", key)
        .single();
      data = (result as { data: unknown }).data;
      error = (result as { error: unknown }).error;
    } catch (thrown) {
      throw new AgentRuntimeError({ type: "load", slug: key, cause: thrown });
    }

    if (error) {
      throw new AgentRuntimeError({ type: "load", slug: key, cause: error });
    }
    if (!data || typeof data !== "object") {
      throw new AgentRuntimeError({
        type: "load",
        slug: key,
        cause: new Error(`No agent row returned for ${mode}="${key}".`),
      });
    }

    const row = normalizeRow(key, data as Record<string, unknown>);
    if (cache) {
      memo.set(cacheKey, { row, expiresAt: now() + cache.ttlMs });
    }
    return row;
  }

  const byName = (slug: string) => loadBy("name", slug);
  const byId = (id: string) => loadBy("id", id);

  return {
    load: byName,
    byName,
    byId,
  };
}

function normalizeRow(slug: string, raw: Record<string, unknown>): AgentRow {
  const name = stringField(raw, "name");
  const model = stringField(raw, "model");
  const system_instruction = stringField(raw, "system_instruction");
  const config = normalizeConfig(slug, raw.config);

  if (!name) {
    throw new AgentRuntimeError({
      type: "load",
      slug,
      cause: new Error(`Agent row for "${slug}" is missing "name".`),
    });
  }
  if (!model) {
    throw new AgentRuntimeError({
      type: "load",
      slug,
      cause: new Error(`Agent row for "${slug}" is missing "model".`),
    });
  }
  if (system_instruction == null) {
    throw new AgentRuntimeError({
      type: "load",
      slug,
      cause: new Error(`Agent row for "${slug}" is missing "system_instruction".`),
    });
  }

  return { name, model, system_instruction, config };
}

function stringField(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  return typeof value === "string" ? value : "";
}

function normalizeConfig(slug: string, raw: unknown): AgentRowConfig {
  if (raw == null) {
    throw new AgentRuntimeError({
      type: "load",
      slug,
      cause: new Error(`Agent row for "${slug}" is missing "config".`),
    });
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new AgentRuntimeError({
      type: "load",
      slug,
      cause: new Error(`Agent row for "${slug}" has a non-object "config".`),
    });
  }

  const config = raw as Record<string, unknown>;
  const provider = config.provider;
  const max_tokens = config.max_tokens;

  if (provider !== "anthropic" && provider !== "google" && provider !== "openai") {
    throw new AgentRuntimeError({
      type: "load",
      slug,
      cause: new Error(
        `Agent row for "${slug}" has invalid config.provider (${JSON.stringify(provider)}).`
      ),
    });
  }
  if (typeof max_tokens !== "number" || !Number.isFinite(max_tokens) || max_tokens <= 0) {
    throw new AgentRuntimeError({
      type: "load",
      slug,
      cause: new Error(
        `Agent row for "${slug}" has invalid config.max_tokens (${JSON.stringify(max_tokens)}).`
      ),
    });
  }

  const temperature = config.temperature;
  if (temperature !== undefined) {
    if (typeof temperature !== "number" || !Number.isFinite(temperature) || temperature < 0) {
      throw new AgentRuntimeError({
        type: "load",
        slug,
        cause: new Error(
          `Agent row for "${slug}" has invalid config.temperature (${JSON.stringify(temperature)}).`
        ),
      });
    }
  }

  return { ...config, provider, max_tokens } as AgentRowConfig;
}
