import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { createInvoke } from "./invoke.js";
import { createLoader } from "./loader.js";
import type { AgentLoader } from "./loader.js";
import { createProvider } from "./providers/index.js";
import type { Provider } from "./providers/types.js";
import type { AgentRow, InvokeArgs, InvokeResult, SkipLLMOption, ToolRegistry } from "./types.js";
import type { ZodTypeAny } from "zod";

export type RuntimeOptions = {
  supabase:
    | { client: SupabaseClient }
    | { url: string; serviceRoleKey: string };
  cache?: { ttlMs: number };
  providerEnv?: {
    fetch?: typeof fetch;
    anthropicApiKey?: string;
    openaiApiKey?: string;
    googleApiKey?: string;
  };
  /**
   * Deterministic-bypass hatch (0.3.0). See `SkipLLMOption` in `types.ts`.
   * When unset, falls back to `process.env.SKIP_LLM === "1"` (boolean mode).
   */
  skipLLM?: SkipLLMOption;
  now?: () => number;
};

export type Runtime = {
  invoke<TSchema extends ZodTypeAny | undefined = undefined>(
    args: InvokeArgs<TSchema>
  ): Promise<InvokeResult<TSchema>>;
  loader: AgentLoader;
};

export function createRuntime(opts: RuntimeOptions): Runtime {
  const client = "client" in opts.supabase ? opts.supabase.client : createServerClient(opts.supabase);
  const loader = createLoader({ client, cache: opts.cache, now: opts.now });
  const providerCache = new Map<string, Provider>();
  const fetchImpl = opts.providerEnv?.fetch ?? globalThis.fetch;
  const skipLLM = resolveSkipLLM(opts.skipLLM);

  function providerFor(row: AgentRow): Provider {
    const cached = providerCache.get(row.config.provider);
    if (cached) return cached;
    const provider = createProvider(row.config.provider, {
      fetch: fetchImpl,
      apiKey: pickApiKey(row.config.provider, opts.providerEnv),
    });
    providerCache.set(row.config.provider, provider);
    return provider;
  }

  const invoke = createInvoke({ loader, providerFor, skipLLM });

  return { invoke, loader };
}

function createServerClient(supabase: { url: string; serviceRoleKey: string }): SupabaseClient {
  return createClient(supabase.url, supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function pickApiKey(
  provider: "anthropic" | "openai" | "google",
  env: RuntimeOptions["providerEnv"]
): string | undefined {
  switch (provider) {
    case "anthropic":
      return env?.anthropicApiKey;
    case "openai":
      return env?.openaiApiKey;
    case "google":
      return env?.googleApiKey;
  }
}

function resolveSkipLLM(option: SkipLLMOption | undefined): SkipLLMOption | undefined {
  if (option !== undefined) return option;
  // Fall back to SKIP_LLM=1 from process.env (matches Titos-Inventario's existing hatch).
  if (typeof process !== "undefined" && process.env && process.env.SKIP_LLM === "1") {
    return true;
  }
  return undefined;
}

export type { ToolRegistry };
