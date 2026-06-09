# Pre-plan: Triage `wip/2026-06-01-pre-adoption` ahead of Plan 5

**Date:** 2026-06-09
**Status:** Pre-plan (backlog). Not promoted to a plan; the slicing question is the open decision.
**Origin:** Blueprint § Plan 5 calls for "rewire the existing playground onto `@dragonflowio/agent-runtime`" — but `main` carries only the monorepo skeleton (`apps/playground/app/{layout,page,globals.css}.tsx` plus one shadcn button). The real playground UI lives on [`wip/2026-06-01-pre-adoption`](https://github.com/dragonflowio/Dragonflow_Agents/tree/wip/2026-06-01-pre-adoption) in the **pre-monorepo flat layout**, and AGENTS.md rule #6 forbids merging that branch wholesale. This pre-plan locks in how to land the wip work first so Plan 5 is just a rewire, not a port + rewire.

## What's on `wip/2026-06-01-pre-adoption`

Counted from the branch (excluding `node_modules`, `public`, `components/ui/*` shadcn primitives):

| Slice | Files | Touches the LLM-call boundary? | Replaced by `@dragonflowio/agent-runtime`? |
|---|---|---|---|
| **A. Backend infra (non-LLM)** | `lib/supabase/{server,key}.ts`, `lib/crypto.ts`, `lib/adapters/{adapter,factory,home,remote}.ts`, `lib/types/{agent,connection,model,project}.ts`, `lib/utils.ts` | No | No — keep. |
| **B. Management surface — agents/projects/settings UI + API** | `app/agents/[id]/page.tsx`, `app/projects/`, `app/settings/page.tsx`, `app/api/{agents,projects,models,connections}/**`, `components/agent/{config,schema,AgentHeader,AgentTabs}/**`, `components/{layout,project,settings,sidebar}/**` | No | No — keep. |
| **C. Playground chat surface** | `components/agent/playground/**`, `app/api/chat/route.ts` | **Yes — bespoke invocation.** | `app/api/chat/route.ts` is replaced (it currently uses `lib/providers/*`). Playground components are descriptive UI — keep, but their data path changes. |
| **D. Provider abstraction (LLM boundary)** | `lib/providers/{anthropic,google,openai,index,types}.ts` | Yes — this **is** the bespoke invocation code. | **Yes — delete.** Replaced wholesale by `@dragonflowio/agent-runtime`'s loader + providers. |

Total: ~57 source files + `package.json` deps (`ajv`, `@monaco-editor/react`, `tailwindcss-animate` not yet on the monorepo `apps/playground/package.json`).

## Why triage before Plan 5

The blueprint says Plan 5 "rewires the existing playground" and "deletes bespoke invocation code." If we let Plan 5 also port slices A, B, C from the flat layout to `apps/playground/`, the PR balloons from "rewire one chat route + delete one provider layer" to "port ~57 files **and** rewire" — too large for meaningful review, and it conflates two different review concerns:

- *Triage* is a judgment-call review: does this file deserve to land on `main` at all?
- *Rewire* is a contract review: does the new chat route use the runtime correctly?

Splitting them keeps each PR sharp.

## Proposed plan sequence (replaces this pre-plan when promoted)

The blueprint's Plan 5 numbering is global to the cross-project thread. To avoid renumbering downstream blueprint plans (Plan 6 fan-out, Plan 7 promotion), the triage work lands as **two locally-numbered triage plans before Plan 5**, with explicit cross-references back to the blueprint thread.

1. **Plan 5-pre-a — Land the management surface (slices A + B).**
   *Branch:* `feat/plan-5-pre-a-management-surface`.
   *Scope:* Cherry-pick `lib/supabase/`, `lib/crypto.ts`, `lib/adapters/`, `lib/types/`, `lib/utils.ts`, the agents/projects/settings routes and UI, and the sidebar / TopNav into `apps/playground/`. Add missing deps to `apps/playground/package.json`. Do **not** port `lib/providers/` or `app/api/chat/route.ts`. The chat tab can render disabled / "wiring in Plan 5" until rewire lands.
   *Acceptance:* `pnpm -F @dragonflow-agents/playground build` + `lint` + `typecheck` all green. Agent CRUD, project CRUD, settings work against the `home` adapter (default). The chat tab renders as a placeholder that does not call any LLM.
   *Sized for:* one PR, ~50 files, ~1 day of agent work.

2. **Plan 5 — Playground rewired onto `@dragonflowio/agent-runtime`.**
   *Branch (blueprint-locked):* `feat/plan-5-playground-rewire`.
   *Scope per blueprint § Plan 5 (verbatim):* rewire `app/api/chat/route.ts` to call `@dragonflowio/agent-runtime` via the same shared-runtime pattern Plan 4 established (`getCanvasRuntime` → analogous `getPlaygroundRuntime`); add the tool-registry UI (per tool: `stub` or `disabled`); render structured outputs via the runtime's parser; delete `lib/providers/` and any other bespoke invocation code; verify parity against the Plan 4 pilot on at least one shared agent slug.
   *Acceptance:* blueprint § Plan 5 acceptance criteria, verbatim.
   *Sized for:* one PR, ~15 files changed, ~1 day of agent work.

Optionally, slice B can split further into "slice B-config" (agent config UI + agents API) and "slice B-shell" (projects/settings/sidebar) if the single Plan 5-pre-a PR ends up too large at draft time — defer that call until the drafter sees the diff.

## Open decisions for the user

These are blocking promotion of this pre-plan:

1. **Two triage plans, or one?** Recommended: one (Plan 5-pre-a) covering A + B as a single port. Reason: A and B are tightly coupled (adapters power the management UI; types are imported throughout), and the management UI has no LLM dependency to confuse the review. Alternative: split into A → B if reviewer prefers smaller PRs.
2. **Authoritative `package.json` for `apps/playground/`.** The wip branch's flat `package.json` and the current `apps/playground/package.json` diverge (wip has `ajv`, `@monaco-editor/react`, `tailwindcss-animate`; current has them missing; both have `shadcn ^4.1.0`). Recommended: extend the current `apps/playground/package.json` (don't overwrite) — keep the monorepo-aware `name`, add the missing deps. Confirm there are no version downgrades.
3. **Numbering / branch name.** The pre-port plan uses `feat/plan-5-pre-a-management-surface`. Alternative: `feat/plan-4.5-management-surface`. Per AGENTS.md *Branch and PR conventions*, slug is up to the drafter. Recommended: `plan-5-pre-a` keeps the blueprint anchor obvious.
4. **Untriaged residue.** Anything on `wip/2026-06-01-pre-adoption` that neither Plan 5-pre-a nor Plan 5 cherry-picks (likely: nothing; everything maps to A/B/C/D above). Confirm we are okay deleting the `wip/2026-06-01-pre-adoption` branch after Plan 5 merges, on the assumption that A+B+C-rewired covers the salvageable surface. Items in [`docs/pre-plan-deferred-features-2026-06-08.md`](pre-plan-deferred-features-2026-06-08.md) (voice recording, prompt versioning, etc.) are tracked separately and not gated on the wip branch existing.

## What this pre-plan replaces

This pre-plan supersedes the one-line backlog entry in [STATUS.md](../STATUS.md):

> _2026-06-01 — Triage `wip/2026-06-01-pre-adoption` (~86 files: agents/projects/settings/api routes, lib/adapters, lib/providers, lib/supabase, lib/crypto, additional shadcn UI components, modifications to app/{globals.css,layout.tsx,page.tsx}, next.config.ts, package.json). Decide what to promote to feat/plan-<N>-<slug> plans, what to drop, what to extract piecemeal. Don't merge the branch wholesale._

On promotion, the STATUS.md backlog row shrinks to a single-line pointer at this pre-plan, per AGENTS.md *Backlog and pre-plans*.

## Plan Sequence (global, blueprint-anchored)

- Plan 0 — Move off-table LLM calls onto `agents` (parallel, per repo). _Not this repo (no LLMs yet)._
- Plan 1 — Audit each consuming repo's invocation. _Not this repo._
- Plan 2 — Playbook conventions + pilot decision. _Merged in `playbook`._
- Plan 3 — `@dragonflowio/agent-runtime@0.1.0` published from `Dragonflow_Agents`. **Done** ([#6](https://github.com/dragonflowio/Dragonflow_Agents/pull/6)).
- Plan 4 — Pilot adoption in `Dragonflow_Canvas`. **Done** ([Canvas#6](https://github.com/dragonflowio/Dragonflow_Canvas/pull/6)).
- **Plan 5-pre-a — Land the management surface from the wip branch** (this pre-plan). _Open._
- **Plan 5 — Playground rewired onto `@dragonflowio/agent-runtime`** (blueprint-locked, gated on Plan 5-pre-a). _Open._
- Plan 6 — Fan-out adoption across consuming repos. _Independent of this thread; can run in parallel with Plans 5-pre-a/5._
- Plan 7 — Promote conventions from candidate to standard. _Gated on Plan 5 **and** all Plan 6 PRs._
