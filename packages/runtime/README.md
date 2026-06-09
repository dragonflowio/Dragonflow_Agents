# `@dragonflowio/agent-runtime`

Cross-project LLM agent runtime for Dragonflow. Loads agent rows from a per-project [`agents`](https://github.com/dragonflowio/playbook/blob/main/playbook/agents-table.md) Supabase table and invokes Anthropic, Google, or OpenAI models through one `invoke({ slug, input })` entry point.

Implements the [v0.1 invocation contract](https://github.com/dragonflowio/playbook/blob/main/playbook/agent-invocation-contract.md). The library covers the LLM-call boundary only — tool side effects, project-specific context assembly, and the `agents` rows themselves stay with the consuming project.

## Install

```sh
npm install @dragonflowio/agent-runtime @supabase/supabase-js zod
```

Peer deps: `@supabase/supabase-js ^2`, `zod ^3.23`.

## Environment

The runtime needs Supabase credentials to load agent rows, plus one API key per provider you use.

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Project URL (used when you pass `{ url, serviceRoleKey }` rather than a pre-built client). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server-side only. |
| `ANTHROPIC_API_KEY` | Required if any agent row's `config.provider === 'anthropic'`. |
| `OPENAI_API_KEY` | Required if any agent row's `config.provider === 'openai'`. |
| `GOOGLE_API_KEY` | Required if any agent row's `config.provider === 'google'`. |

Provider keys can also be passed via the `providerEnv` constructor option (useful for tests).

## Quick start

```ts
import { createRuntime, createToolRegistry } from "@dragonflowio/agent-runtime";
import { z } from "zod";

const runtime = createRuntime({
  supabase: { url: process.env.SUPABASE_URL!, serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY! },
  cache: { ttlMs: 60_000 }, // optional — re-read on every call by default
});

// 1) Plain-text agent (Anthropic)
const { output } = await runtime.invoke({
  slug: "summarize",
  input: "Summarize this in one sentence: ...",
});

// 2) Structured-output agent (Zod schema)
const verdict = z.object({ verdict: z.enum(["yes", "no"]) });
const { output: yesno } = await runtime.invoke({
  slug: "judge",
  input: "Is the sky blue?",
  schema: verdict,
});

// 3) Tool-using agent (OpenAI)
const registry = createToolRegistry();
registry.register("fetch_user", {
  description: "Look up a user by id.",
  schema: z.object({ id: z.string().uuid() }),
  handler: async ({ id }) => ({ id, name: "Ada" }),
});
const { output: reply } = await runtime.invoke({
  slug: "support-bot",
  input: "Who is user abc-…?",
  tools: registry,
});
```

`InvokeResult` carries `{ output, raw, usage, agent }`. `agent` is `{ name, model, provider }` — useful for audit-log columns that pin a result to the model that produced it (since `0.2.0`).

## Error envelope

Every failure is wrapped in `AgentRuntimeError` with a discriminated `detail` union — `load | provider | parse | validate | tool`. Use `serializeError(err)` for audit-log writes.

`provider`, `parse`, and `validate` variants carry an optional `usage` field so token counts survive the error path when the provider already returned them (since `0.2.0`).

```ts
import { AgentRuntimeError, serializeError } from "@dragonflowio/agent-runtime";

try {
  await runtime.invoke({ slug: "judge", input: "?", schema });
} catch (err) {
  if (err instanceof AgentRuntimeError) {
    switch (err.detail.type) {
      case "load":     /* slug bad or RLS denied */ break;
      case "provider": /* LLM API failed */ break;
      case "parse":    /* response wasn't JSON */ break;
      case "validate": /* JSON didn't match schema */ break;
      case "tool":     /* tool handler threw */ break;
    }
  }
  await audit.write(serializeError(err));
}
```

## Boundary

What's in the library vs. what stays in the consuming repo is the [contract's *Boundary* table](https://github.com/dragonflowio/playbook/blob/main/playbook/agent-invocation-contract.md#boundary). The short version: the library makes and parses LLM calls; the consumer owns tools, context assembly, agent rows, and Supabase credentials.

## Version semantics

`0.x` is pre-stable — minor bumps may carry breaking changes; patches are bugfixes only. Pin to a minor (`^0.1.0`). `1.0.0` ships after the contract has survived Plan 4 (pilot pressure test) and Plan 6 (fan-out adoption) without further breaking changes.

## Status

Plan 3 of the [agent-runtime blueprint](https://github.com/dragonflowio/playbook/blob/main/docs/agent-runtime-blueprint-2026-06-06.md). Pilot adoption (Plan 4) shipped in [Dragonflow_Canvas#6](https://github.com/dragonflowio/Dragonflow_Canvas/pull/6); its [contract gap log](https://github.com/dragonflowio/Dragonflow_Canvas/blob/main/docs/agent-runtime-pilot-gaps.md) drives the `0.2.0` additions above.

- Plan 5 rewires the [`Dragonflow_Agents`](https://github.com/dragonflowio/Dragonflow_Agents) playground onto this library.
- Plan 6 fan-out is in progress per repo (`Dragonflow_Product`, `Titos_Automations`, `Proveedores-Admin`).
