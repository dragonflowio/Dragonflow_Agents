---
kind: feature
autonomy: needs-checkpoints
status: in-progress
created: 2026-06-09
repos:
  - Dragonflow_Agents
---

# Plan 5 — Playground rewired onto `@dragonflowio/agent-runtime`

**Status:** Phase 1 (Code) — plan file committed, awaiting user review before implementation.
**Created:** 2026-06-09
**Repo:** `Dragonflow_Agents`
**Branch:** `feat/plan-5-playground-rewire` (blueprint-locked)
**Intended owner:** One implementation agent (this session, continuing after plan approval).
**Related:**
- Blueprint anchor — [agent-runtime blueprint § Plan 5](https://github.com/dragonflowio/playbook/blob/main/docs/agent-runtime-blueprint-2026-06-06.md#plan-5--playground-rewired-onto-dragonflowioagent-runtime).
- Prior slice — [`docs/plans/plan-5-pre-a-management-surface-2026-06-09.md`](plan-5-pre-a-management-surface-2026-06-09.md) ([#11](https://github.com/dragonflowio/Dragonflow_Agents/pull/11)) — landed the management surface and stubbed the chat tab. Plan 5 replaces that stub.
- Pilot to compare against — [`Dragonflow_Canvas` Plan 4](https://github.com/dragonflowio/Dragonflow_Canvas/pull/6), specifically the `getCanvasRuntime()` singleton at [`lib/llm/runtime.ts`](https://github.com/dragonflowio/Dragonflow_Canvas/blob/main/lib/llm/runtime.ts). Plan 5 mirrors that pattern as `getPlaygroundRuntime()`.
- Contract — [`playbook/agent-invocation-contract.md`](https://github.com/dragonflowio/playbook/blob/main/playbook/agent-invocation-contract.md) (v0.1; pinned at `@dragonflowio/agent-runtime@0.1.0`).

## Goal

The playground's chat tab calls `@dragonflowio/agent-runtime` directly — the same library a consuming app (Canvas) calls — so iterating on an agent slug in the playground exercises the exact code path production runs. The bespoke chat-orchestration layer is gone: no parallel provider abstraction, no parallel parser, no parallel tool-call loop. A descriptive tool-registry UI lets the operator pick `disabled` or `stub` per tool (no HTTP proxy in v0.1), structured outputs render through the runtime's own `parseStructured`, and at least one shared agent slug behaves consistently between the playground and the Canvas pilot.

## Scope

In scope:

- **Runtime singleton.** Create `apps/playground/lib/runtime.ts` exporting `getPlaygroundRuntime(): Runtime`, mirroring `Dragonflow_Canvas/lib/llm/runtime.ts`. Constructed once per server process, given a service-role Supabase client via `apps/playground/lib/supabase/server.ts`. `import 'server-only'` at top.
- **Chat API route.** Create `apps/playground/app/api/chat/route.ts` (POST). Request body: `{ slug: string; messages: Array<{ role: 'user' | 'assistant'; content: string }>; system?: string; toolConfig?: Record<string, 'disabled' | 'stub'> }`. Calls `getPlaygroundRuntime().invoke({ slug, input: { messages, system }, tools: buildToolRegistry(agent, toolConfig), schema: z.any() if agent.config.output_schema else undefined })`. Returns `{ output: unknown; raw: unknown; usage: Usage; agent: InvokeAgentSummary; toolCalls: Array<{ id, name, arguments, result }> }` on success; on `AgentRuntimeError`, returns `serializeError(err)` with HTTP 4xx/5xx mapped from variant.
- **Tool registry from agent config.** New helper `apps/playground/lib/playground/tool-registry.ts` (or inline in the route — drafter's call): given `agent.config.tools` (array of `ToolDefinition`) and the per-tool `toolConfig` from the request, returns a `ToolRegistry` from `createToolRegistry()`. For each `'stub'` entry, register a handler that resolves to `{ stub: true, name, arguments: input }` so the runtime's tool loop terminates deterministically. `'disabled'` tools are not registered (the model never sees them in this run). MCP-type tools are surfaced in the UI but only `disabled` is available at v0.1 — no HTTP proxy per blueprint locked decision #2.
- **PlaygroundTab rewire.** Replace the Plan 5-pre-a placeholder in `apps/playground/components/agent/playground/PlaygroundTab.tsx` with a real chat surface that:
  - Reuses `MessageList`, `MessageBubble`, `InputBar`, `OverridePanel`, and `ToolCallDisplay` from `components/agent/playground/`.
  - Holds `messages: PlaygroundMessage[]`, `loading: boolean`, `error: string | null`, `overrides: PlaygroundOverrides`, `toolConfig: Record<string, 'disabled' | 'stub'>` in local state.
  - Submits via `fetch('/api/chat', { method: 'POST', ... })`; renders the awaited response (v0.1 is non-streaming — see *Out of scope*).
  - Renders structured outputs by pretty-printing `result.output` as JSON when the agent has `config.output_schema`; falls back to plain text otherwise. Uses `stripJsonFence` from `@dragonflowio/agent-runtime` for the raw view only; never re-implements parsing.
  - Surfaces `toolCalls` in `ToolCallDisplay` (existing component).
- **Tool-registry UI.** A new panel inside `PlaygroundTab` (sibling of `OverridePanel`) listing every tool in `agent.config.tools`. Per tool: name, description, type (`function` or `mcp`), and a dropdown — `disabled | stub` for `function` tools; `disabled` only (with a "MCP HTTP proxy not in v0.1" hint) for `mcp` tools. State held in `PlaygroundTab`, sent on each `/api/chat` POST. No back-end persistence — this is per-run config.
- **Dependency add.** `zod` to `apps/playground/package.json` (peer of `@dragonflowio/agent-runtime`'s zod usage; needed for `z.any()` schemas and `createToolRegistry` zod schemas). The runtime package already takes zod as a peer dep — confirm at draft time and pin to the same range the runtime ships with (currently `^3.x` per `packages/runtime/package.json`).
- **Delete the placeholder.** The Plan 5-pre-a placeholder card text in `PlaygroundTab.tsx` goes away. The dead-code references (`StreamingMessage`, `streamBuffer`) listed in the placeholder's hint also get deleted from `PlaygroundTab.tsx` and `MessageList.tsx`; `StreamingMessage.tsx` itself is deleted if no other consumer remains. (v0.1 contract has no streaming — keeping the streaming UI as scaffolding is a half-finished implementation forbidden by AGENTS.md.)
- **Parity verification.** As part of Verify, execute one shared agent slug end-to-end against the same Supabase project from both the playground (via the new chat route) and a Canvas dev server, and compare: parsed `output` is structurally equal, `usage.input_tokens` + `usage.output_tokens` are within a reasonable variance (model-side non-determinism, not a contract issue), and `agent.name` + `agent.model` + `agent.provider` match. Capture the comparison in the PR description. Pick the slug with Fernando at Verify time.

Out of scope (deferred):

- **Streaming / SSE.** `@dragonflowio/agent-runtime@0.1.x` exposes only `invoke()` (single Promise). Adding streaming requires a contract change in the runtime, not playground work. Captured in *Intentionally unfinished* if pain shows up.
- **MCP HTTP proxy.** Locked decision #2 — `disabled` for MCP tools is the only option until the runtime adds an MCP-proxy primitive (not on the blueprint).
- **JSON-Schema → Zod conversion for agent `output_schema`.** v0.1 uses permissive `z.any()` at the runtime boundary (matches Canvas pilot per [`playbook` CHANGELOG 2026-06-09](https://github.com/dragonflowio/playbook/blob/main/CHANGELOG.md) v0.2 amendments). The on-row JSON Schema is a candidate-conventions item upstream; the playground does not enforce it client-side either, so renderer accepts whatever the model returns and pretty-prints if valid JSON.
- **Voice / Slack / next-agent execution.** Voice and Slack stay configurable on the agent (preserved by Plan 5-pre-a) but no execution path here. Agent chaining (`next_agent_id`) is a deferred feature per [`docs/pre-plan-deferred-features-2026-06-08.md`](../pre-plan-deferred-features-2026-06-08.md); not on this plan.
- **Per-tool argument editor.** The tool-registry UI only picks `disabled | stub`; no UI for editing the stub's response shape this round. Backlog if useful.
- **Supabase migrations.** Same situation as Plan 5-pre-a — the route assumes `agents` rows exist. Fresh-project provisioning remains in *Intentionally unfinished* per STATUS.md.
- **Deletion of `wip/2026-06-01-pre-adoption`.** Deferred per Plan 5-pre-a; sweep PR after this plan merges.
- **Removing the four `react-hooks/set-state-in-effect` disables** flagged in STATUS.md *Intentionally unfinished*. They live in files Plan 5 doesn't touch (`TopNav`, `ProjectList`, `SchemaTab`, `RawJsonEditor`) — none of which are on the chat path. Refactor stays open in STATUS.md.

## Implementation Steps

Each step is one coherent change. Step 1 is the plan file itself (this commit). Steps 2–9 are implementation work that lands after the user approves the plan; the PR converts from ready-for-review → draft as the first implementation commit lands, per AGENTS.md *Draft vs. ready-for-review*.

1. **Promote the plan.** This commit. Branch `feat/plan-5-playground-rewire`, plan file at `docs/plans/plan-5-playground-rewire-2026-06-09.md`. Add the row to `STATUS.md` *Active plans* in the same commit. Open PR **ready-for-review** with this commit only. Wait for user approval before any further code.

2. **Convert PR to draft + add `zod` dep.** Open `apps/playground/package.json`, add `zod` at the same `^` range `packages/runtime/package.json` pins. Run `pnpm install` at the repo root. Commit `package.json` + `pnpm-lock.yaml`. `pnpm -F @dragonflow-agents/playground typecheck` should still be green.

3. **Add `getPlaygroundRuntime` singleton.** Create `apps/playground/lib/runtime.ts`:
   ```ts
   import 'server-only'
   import { createRuntime, type Runtime } from '@dragonflowio/agent-runtime'
   import { createServerClient } from '@/lib/supabase/server'

   let cached: Runtime | null = null
   export function getPlaygroundRuntime(): Runtime {
     if (cached) return cached
     cached = createRuntime({ supabase: { client: createServerClient() } })
     return cached
   }
   ```
   Provider keys (`anthropicApiKey` / `openaiApiKey` / `googleApiKey`) read from `process.env` and passed through `providerEnv` if the runtime constructor requires it explicitly — check `RuntimeOptions.providerEnv` shape at implementation time and wire whichever env vars the runtime supports for v0.1. `typecheck` should remain green.

4. **Add tool-registry builder.** Create `apps/playground/lib/playground/tool-registry.ts` exporting `buildToolRegistry(agent: Agent, toolConfig: Record<string, 'disabled' | 'stub'>): ToolRegistry | undefined`. Iterates `agent.config?.tools ?? []`; for each entry where `toolConfig[name] === 'stub'` and `type === 'function'`, registers a handler `async (input) => ({ stub: true, name, arguments: input })` using `createToolRegistry()` and `z.any()` as the schema. Returns `undefined` if no tools are registered (matches the runtime's `tools?: ToolRegistry` shape). Add unit-style smoke test in `apps/playground/lib/playground/tool-registry.test.ts` covering: (a) empty tools → `undefined`; (b) one function tool stubbed → registry contains it; (c) MCP tool with config `'stub'` → not registered (UI gate enforced server-side).

5. **Add chat API route.** Create `apps/playground/app/api/chat/route.ts`:
   - `POST` handler.
   - Parses + validates body shape with zod (reject 400 on bad shape).
   - Loads agent via `getPlaygroundRuntime().loader.load(slug)` to read `agent.config.output_schema` and `agent.config.tools`. (One Supabase round-trip; runtime cache covers re-loads inside `invoke`.)
   - Calls `runtime.invoke({ slug, input: { messages, system }, tools: buildToolRegistry(agentRow, toolConfig), schema: agentRow.config.output_schema ? z.any() : undefined })`.
   - On success: 200 with `{ output, raw, usage, agent, toolCalls }`. `toolCalls` is empty array if `tools` not passed; otherwise pull from the runtime response if exposed (check `InvokeResult` shape — if not exposed yet, omit and document in the route's body shape).
   - On `AgentRuntimeError`: map variant → HTTP — `load` → 404, `parse` → 502, `validate` → 422, `provider` → 502, `tool` → 500. Body is `serializeError(err)`.
   - `import 'server-only'` at top.

6. **Rewire `PlaygroundTab.tsx`.** Replace the placeholder body with the real chat surface. State: `messages`, `loading`, `error`, `overrides`, `toolConfig`. `handleSend(text)` appends a user message, sets `loading=true`, POSTs to `/api/chat`, appends the assistant message with output + toolCalls on success, sets `error` on failure. Renders `OverridePanel` when toggled, plus a new `ToolRegistryPanel` (next step) when the agent has tools. Use a spinner during `loading` (no streaming surface). Read `agent.config.output_schema` to decide whether the assistant bubble renders pretty-JSON or plain text.

7. **Add `ToolRegistryPanel.tsx`.** New `apps/playground/components/agent/playground/ToolRegistryPanel.tsx`. Props: `tools: ToolDefinition[]`, `value: Record<string, 'disabled' | 'stub'>`, `onChange`. Renders one row per tool: name, description, type badge, and a `Select` with options `disabled | stub`. For MCP tools, lock to `disabled` with a tooltip "MCP HTTP proxy not in v0.1". When the agent has no tools, the component renders nothing (parent decides not to mount it).

8. **Delete dead streaming scaffolding.** Remove `streamBuffer` and `toolCalls`-while-streaming props from `MessageList.tsx` (or condense `MessageList` to only the post-stream path). Delete `apps/playground/components/agent/playground/StreamingMessage.tsx` if no consumer remains. Update `MessageList`'s props in `PlaygroundTab.tsx` accordingly. `typecheck`, `lint`, `build` must all be green at the end of this step.

9. **STATUS.md updates inside this PR.** Phase 5 (post-merge) removes the *Active plans* row and flips the plan-file frontmatter. The *Backlog* entry pointing at this plan is already removed in step 1 (promotion moves it to *Active plans*). The two *Intentionally unfinished* rows that mention this plan (the `wip/2026-06-01-pre-adoption` deletion and the four `react-hooks/set-state-in-effect` disables) **stay**: branch deletion is the deferred Plan 5-pre-a sweep, and the disabled files are out of Plan 5's scope (per *Scope* above).

10. **Verify against the Acceptance Criteria below.** Capture evidence per criterion in the PR description. Confirm the parity check with Fernando (criterion 5) — schedule a brief sync to pick the shared agent slug and capture the side-by-side. Mark the PR ready-for-review.

11. **Review & merge pause point.** Wait for user merge confirmation per AGENTS.md *Plan lifecycle*.

## Acceptance Criteria

1. `apps/playground/app/api/chat/route.ts` exists, imports `getPlaygroundRuntime` from `@/lib/runtime`, and calls `runtime.invoke(...)`. No file under `apps/playground/lib/providers/` exists. No source file in `apps/playground/` references a bespoke provider/parser/tool-loop implementation; only `@dragonflowio/agent-runtime` is used.
2. `pnpm -F @dragonflow-agents/playground typecheck`, `lint`, and `build` all exit 0.
3. From the running playground (`pnpm -F @dragonflow-agents/playground dev`), opening any agent in `app/agents/[id]` and submitting a prompt in the chat tab produces an assistant response that came from `@dragonflowio/agent-runtime`. The network panel shows one POST to `/api/chat`; no other LLM-related egress.
4. For an agent with `config.output_schema` set, the assistant bubble pretty-prints the response as JSON. For an agent without one, it renders plain text. The renderer uses `stripJsonFence` from `@dragonflowio/agent-runtime` only — no UI-local JSON-cleanup helpers.
5. **Parity (manual, with Fernando):** at least one shared agent slug, called with the same input from the playground's `/api/chat` and from a local Canvas dev server's `lib/llm/runtime.ts`, returns structurally-equal parsed `output`, matching `agent.name` / `agent.model` / `agent.provider`, and `usage` token counts within a reasonable variance band documented in the PR description. The shared slug is recorded in the PR.
6. The tool-registry UI is present on agents whose `config.tools` is non-empty. Per-tool dropdown shows `disabled | stub` for `function` tools and `disabled` only for `mcp` tools (with the v0.1 hint). Switching a tool to `stub`, sending a prompt that triggers it, and observing the runtime's tool loop terminate with the stub's deterministic response is captured in the PR (screenshot or response payload).
7. `AgentRuntimeError` variants surface as user-visible errors in the chat tab with distinguishable copy per variant (`load` / `parse` / `validate` / `provider` / `tool`) — verified by triggering at least one (e.g., a bad slug for `load`).
8. `apps/playground/components/agent/playground/StreamingMessage.tsx` is deleted (or, if a consumer outside the chat path exists, justified in the PR). `MessageList.tsx` no longer takes `streamBuffer` or `toolCalls`-while-streaming props.
9. `apps/playground/package.json` adds `zod` at the same `^` range `packages/runtime/package.json` pins; no other dependency changes; pre-existing deps unchanged.
10. STATUS.md *Backlog* no longer carries the 2026-06-09 "Blueprint Plan 5" pointer (folded into this plan); *Intentionally unfinished* no longer carries the placeholder-card row from Plan 5-pre-a.

Criteria 1 + 8 are the "bespoke invocation code is gone" gate. Criterion 5 is the parity gate. Criteria 2–4 are the green-build / functional gate. Criteria 6–7 are the contract-surface gate.

## Plan Sequence

- Plan 0 — Move off-table LLM calls onto `agents` (parallel, per repo). _Not this repo._
- Plan 1 — Audit each consuming repo's invocation. _Not this repo._
- Plan 2 — Playbook conventions + pilot decision. _Merged._
- Plan 3 — `@dragonflowio/agent-runtime@0.1.0` published. **Done** ([#6](https://github.com/dragonflowio/Dragonflow_Agents/pull/6)).
- Plan 4 — Pilot adoption in `Dragonflow_Canvas`. **Done** ([Canvas#6](https://github.com/dragonflowio/Dragonflow_Canvas/pull/6)).
- Plan 5-pre-a — Land the management surface. **Done** ([#11](https://github.com/dragonflowio/Dragonflow_Agents/pull/11)).
- **Plan 5 — Playground rewired onto `@dragonflowio/agent-runtime` (this plan).** In progress.
- Plan 6 — Fan-out across consuming repos. _Independent; can run in parallel._
- Plan 7 — Promote conventions from candidate to standard. _Gated on Plan 5 **and** all Plan 6 PRs._

## Handoff to next plan

When this plan is implemented and verified, the playground sits on `@dragonflowio/agent-runtime` and the blueprint's Plan 5 obligation in this repo is met. There is no immediate next plan in `Dragonflow_Agents` — the next blueprint motion is Plan 7 (convention promotion), which happens upstream in `playbook` and is gated on both this plan *and* all Plan 6 fan-out PRs across consuming repos.

> **Next plan path:** *(none in this repo)* — the playbook's Plan 7 is the next blueprint step. When the last Plan 6 fan-out PR merges, hand off via the playbook's STATUS.md. This repo will gain a follow-up plan only when Plan 6 names a consumer that lives here (none currently planned).

Intentionally unfinished — to be tracked in `STATUS.md` after merge:

- Streaming / SSE support in `@dragonflowio/agent-runtime`. If iteration pain surfaces in the playground, open a contract-change PR against the playbook before adding a parallel streaming path here.
- JSON-Schema → Zod conversion for `agent.config.output_schema`. Candidate convention upstream; not blocking v0.1.
- Per-tool stub-response editor in the playground tool-registry UI. Promote to a backlog row only if Fernando wants finer control during iteration.
- Deletion of `wip/2026-06-01-pre-adoption`. Sweep PR after this plan merges, per Plan 5-pre-a's deferral.
