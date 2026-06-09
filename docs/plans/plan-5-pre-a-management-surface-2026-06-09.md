---
kind: feature
autonomy: agent-runnable
status: in-progress
created: 2026-06-09
repos:
  - Dragonflow_Agents
---

# Plan 5-pre-a — Land the management surface from `wip/2026-06-01-pre-adoption`

**Status:** In progress
**Created:** 2026-06-09
**Repo:** `Dragonflow_Agents`
**Branch:** `feat/plan-5-pre-a-management-surface`
**Intended owner:** One implementation agent (this session)
**Related:**
- Pre-plan locking the slicing — [`docs/pre-plan-wip-triage-2026-06-09.md`](../pre-plan-wip-triage-2026-06-09.md) (merged via [#10](https://github.com/dragonflowio/Dragonflow_Agents/pull/10)).
- Source branch — [`wip/2026-06-01-pre-adoption`](https://github.com/dragonflowio/Dragonflow_Agents/tree/wip/2026-06-01-pre-adoption). AGENTS.md rule #6 forbids wholesale-merging it; this plan extracts the management-surface slices into the monorepo layout.
- Blueprint thread anchor — [agent-runtime blueprint § Plan 5](https://github.com/dragonflowio/playbook/blob/main/docs/agent-runtime-blueprint-2026-06-06.md#plan-5--playground-rewired-onto-dragonflowioagent-runtime). This plan unblocks Plan 5 by landing the surface Plan 5 rewires *around*.

## Goal

`apps/playground/` on `main` carries a working **agent management surface** — agents list, agent config editor (basic / FTE / MCP / tools / next-agent / voice / Slack), projects, settings (connections + models + projects management), the supporting sidebar / TopNav, and the agents/projects/connections/models REST endpoints — backed by the home/remote Supabase adapter pattern. The chat tab renders as a placeholder that does **not** call any LLM. The bespoke `lib/providers/` provider abstraction and the bespoke `app/api/chat/route.ts` are **not** ported. Blueprint Plan 5 then rewires the chat surface onto `@dragonflowio/agent-runtime` against this foundation.

## Scope

In scope (cherry-picked from `wip/2026-06-01-pre-adoption` into `apps/playground/`):

- **Backend infra (slice A from the pre-plan).** `lib/supabase/{server,key}.ts`, `lib/crypto.ts`, `lib/adapters/{adapter,factory,home,remote}.ts`, `lib/types/{agent,connection,model,project}.ts`, `lib/utils.ts`.
- **Management API routes.** `app/api/agents/{,[id]}/route.ts`, `app/api/projects/{,[id]}/route.ts`, `app/api/models/{,[id]}/route.ts`, `app/api/connections/{,[id],activate,discover}/route.ts`.
- **Management UI.** `app/agents/[id]/page.tsx`, `app/projects/{[id],unassigned}/page.tsx`, `app/settings/page.tsx`, the wip `app/{layout,page,globals.css}` (replacing the Next starter currently on `main`), `app/favicon.ico`.
- **Components.** `components/agent/{AgentHeader,AgentTabs}.tsx`, all of `components/agent/config/`, all of `components/agent/schema/`, `components/layout/TopNav.tsx`, `components/project/ProjectAgentTable.tsx`, `components/settings/{ConnectionManager,ModelManager,ProjectManager}.tsx`, all of `components/sidebar/`. **Plus** the components/agent/playground/ folder *as-is* so that imports compile — but the chat surface is wired to a placeholder; see step 7.
- **Package + tool config.** Extend `apps/playground/package.json` with `ajv@^6.14.0`, `@monaco-editor/react@^4.7.0`, `tailwindcss-animate@^1.0.7`. Preserve the monorepo `name`, `version`, and existing deps. Reconcile `components.json` (same shadcn config), `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json` against the wip versions — adopt anything from wip that the management UI depends on; keep the monorepo-aware `paths` / `extends` on `tsconfig.json`.
- **Chat-tab placeholder.** Modify `components/agent/playground/PlaygroundTab.tsx` (or the inline pane in `app/agents/[id]/page.tsx`, depending on the wip wiring) to render *"Chat is being wired onto `@dragonflowio/agent-runtime` — see Plan 5 (`feat/plan-5-playground-rewire`)."* instead of attempting any LLM call. No `fetch('/api/chat', …)` survives in this PR.

Out of scope (deliberately deferred to blueprint Plan 5 or beyond):

- **Anything that touches the LLM-call boundary.** Specifically, `lib/providers/{anthropic,google,openai,index,types}.ts` and `app/api/chat/route.ts` are NOT ported — they are wholesale replaced by `@dragonflowio/agent-runtime` in Plan 5.
- **Tool-registry UI** (per tool: `stub` or `disabled`). Blueprint Plan 5 scope.
- **Structured-output renderer.** Blueprint Plan 5 scope (rendered via the runtime's parser, not re-implemented).
- **Schema-tab evolution.** The schema components port as-is from wip; any improvements wait for after Plan 5.
- **Six post-v1 deferred features.** Tracked in [`docs/pre-plan-deferred-features-2026-06-08.md`](../pre-plan-deferred-features-2026-06-08.md); not gated on this plan.
- **Deletion of `wip/2026-06-01-pre-adoption`.** Deferred per pre-plan open decision #4 until after Plan 5 merges (so any forgotten salvage is still recoverable).
- **Supabase migrations / schema work.** The wip code expects existing `agents`, `projects`, `connections`, `models` tables. Provisioning those tables on a fresh Supabase project is its own concern, captured as a follow-up in *Intentionally unfinished* below.
- **Removing the existing `components/ui/button.tsx`.** Keep the monorepo button; the wip branch carries the same primitive.

## Implementation Steps

Each step is one coherent change. Steps 2–8 each produce a compilable intermediate state where possible; step 9 is the verify pass.

1. **Promote the plan.** This commit. Branch `feat/plan-5-pre-a-management-surface`, plan file at `docs/plans/plan-5-pre-a-management-surface-2026-06-09.md`. Add the row to `STATUS.md` *Active plans*. Open draft PR pointing back here.

2. **Extend `apps/playground/package.json`.** Add `ajv@^6.14.0`, `@monaco-editor/react@^4.7.0`, `tailwindcss-animate@^1.0.7` to `dependencies`. Run `pnpm install` from the repo root. Commit `package.json` + `pnpm-lock.yaml`. Verify with `pnpm -F @dragonflow-agents/playground typecheck` (expected: green, nothing imports them yet).

3. **Port slice A — backend infra.** Copy from `origin/wip/2026-06-01-pre-adoption` into `apps/playground/`:
   - `lib/supabase/server.ts`, `lib/supabase/key.ts`
   - `lib/crypto.ts`
   - `lib/adapters/{adapter,factory,home,remote}.ts`
   - `lib/types/{agent,connection,model,project}.ts`
   - Overwrite `apps/playground/lib/utils.ts` with the wip version (it has the `cn()` helper plus anything else the components import).
   Run `pnpm -F @dragonflow-agents/playground typecheck`. If references to `@/lib/providers` or `@/lib/types/X` not in this slice surface, fix imports forward (likely none — slice A is self-contained).

4. **Port management API routes.** Copy `app/api/agents/`, `app/api/projects/`, `app/api/models/`, `app/api/connections/` from wip into `apps/playground/app/api/`. Do **not** copy `app/api/chat/`. Run `typecheck` — adapter imports should resolve from step 3.

5. **Port shared UI shell.** Overwrite `apps/playground/app/{layout.tsx,page.tsx,globals.css}` with the wip versions; copy `app/favicon.ico`. Reconcile `components.json` (adopt the wip config if it differs — both are shadcn). Reconcile `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` with wip versions; for `tsconfig.json`, take the wip `compilerOptions` (`paths`, `target`, etc.) but preserve any monorepo `extends` or `references` the current file uses.

6. **Port management UI pages + components.** Copy `app/agents/[id]/page.tsx`, `app/projects/{[id],unassigned}/page.tsx`, `app/settings/page.tsx`. Copy `components/agent/{AgentHeader,AgentTabs}.tsx`, all of `components/agent/config/`, all of `components/agent/schema/`, `components/layout/`, `components/project/`, `components/settings/`, all of `components/sidebar/`. **Also** copy `components/agent/playground/` as-is so the imports in `AgentTabs.tsx` resolve. Run `typecheck` — first major-error pass. Resolve import paths and any monorepo-vs-flat discrepancies.

7. **Stub the chat tab.** Modify `components/agent/playground/PlaygroundTab.tsx` (and any sibling component that contains the fetch to `/api/chat`) to render a placeholder card with the text: *"Chat is being wired onto `@dragonflowio/agent-runtime` — see Plan 5 (`feat/plan-5-playground-rewire`)."* Remove the `fetch('/api/chat', …)` calls and the `import` of `@/lib/providers/*` types from these files. Keep `MessageBubble`, `MessageList`, etc. as dead-but-typechecking code — Plan 5 reuses them. Run `typecheck` — expected: green.

8. **Lint + build.** `pnpm -F @dragonflow-agents/playground lint` then `pnpm -F @dragonflow-agents/playground build`. Fix any failures. Both must be green before opening for review.

9. **Verify against the Acceptance Criteria below.** Capture a short evidence note for each criterion in the PR description.

10. **Mark PR ready-for-review** and wait for user merge confirmation per AGENTS.md plan-lifecycle (Review & merge pause point).

## Acceptance Criteria

1. `pnpm -F @dragonflow-agents/playground typecheck` exits 0 with zero errors.
2. `pnpm -F @dragonflow-agents/playground lint` exits 0.
3. `pnpm -F @dragonflow-agents/playground build` exits 0 and produces a Next.js build.
4. No file under `apps/playground/lib/providers/` exists. No file at `apps/playground/app/api/chat/route.ts` exists. No source file under `apps/playground/` imports from `@/lib/providers` or fetches `/api/chat`.
5. The chat tab in the agent detail page renders the placeholder text from step 7 and does not attempt any network call related to LLM invocation.
6. The agents/projects/connections/models REST endpoints under `apps/playground/app/api/` typecheck and import from `apps/playground/lib/adapters/factory`.
7. `apps/playground/package.json` includes `ajv`, `@monaco-editor/react`, and `tailwindcss-animate` at the wip-pinned versions and preserves the monorepo `name`, `version`, and pre-existing deps (no version downgrades).
8. The wip-branch flat-layout files for slices A + B (everything in the *In scope* list above) exist in the monorepo layout under `apps/playground/` with byte-identical or import-path-only-changed contents.
9. No agent slugs are queried at build time; the home adapter's runtime checks still gate Supabase usage so `pnpm build` works without `SUPABASE_URL` set (matches wip behavior).

Criteria 5 and 9 are the regression guards. Criteria 1–3 are the green-build gate. Criterion 4 is the "Plan 5 still has its job" gate.

## Plan Sequence

- Plan 0 — Move off-table LLM calls onto `agents` (parallel, per repo). _Not this repo._
- Plan 1 — Audit each consuming repo's invocation. _Not this repo._
- Plan 2 — Playbook conventions + pilot decision. _Merged._
- Plan 3 — `@dragonflowio/agent-runtime@0.1.0` published. **Done** ([#6](https://github.com/dragonflowio/Dragonflow_Agents/pull/6)).
- Plan 4 — Pilot adoption in `Dragonflow_Canvas`. **Done** ([Canvas#6](https://github.com/dragonflowio/Dragonflow_Canvas/pull/6)).
- **Plan 5-pre-a — Land the management surface (this plan).** In progress.
- Plan 5 — Playground rewired onto `@dragonflowio/agent-runtime` (blueprint-locked). _Gated on this plan._
- Plan 6 — Fan-out across consuming repos. _Independent; can run in parallel._
- Plan 7 — Promote conventions from candidate to standard. _Gated on Plan 5 **and** all Plan 6 PRs._

## Handoff to next plan

When this plan is implemented and verified, hand the user the path to draft and execute blueprint Plan 5:

> **Next plan path:** `docs/plans/plan-5-playground-rewire-2026-06-09.md` in this repo, `Dragonflow_Agents`. Plan 5 drafts and executes the blueprint Plan 5 scope: rewires `apps/playground/app/api/chat/route.ts` onto `@dragonflowio/agent-runtime`, adds the tool-registry UI, swaps the placeholder chat tab for the live runtime-backed surface, and verifies parity against the Plan 4 pilot in `Dragonflow_Canvas` on at least one shared agent slug.

Intentionally unfinished — to be tracked in `STATUS.md` after merge:

- Supabase schema provisioning for a fresh project (the ported routes assume `agents`, `projects`, `connections`, `models` tables already exist). Captured as a follow-up; not gated on Plan 5.
- Deletion of `wip/2026-06-01-pre-adoption`. Deferred until after Plan 5 merges so any forgotten salvage stays recoverable.
