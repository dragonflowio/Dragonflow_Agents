# STATUS.md

> **STATUS.md is data, not rules.** The structural conventions (the four-bucket layout, the active-plans table format, the one-line backlog rule, the pre-plan promotion path) are inlined in [AGENTS.md](AGENTS.md) under the *STATUS.md handling* and *Backlog and pre-plans* sections. Read those at session start; come here for the live entries.

**Last updated:** 2026-06-09

## Active plans

| Plan | Branch | Agent | Last commit | Status |
|---|---|---|---|---|
| Plan 5 — Playground rewired onto `@dragonflowio/agent-runtime` | feat/plan-5-playground-rewire | claude-opus-4-7 | 2026-06-09 | Phase 3 (Verify) — Code complete; static acceptance criteria pass; runtime/manual gates (build on Node 20+, dev-server walkthrough, parity check vs Canvas) pending user verification. |

## Backlog
- 2026-06-08 — Six post-v1 deferred features from the original phase 1–4 effort (voice session recording, agentic agent creation, `prompt_id` fetch from OpenAI prompt store, prompt versioning, large file uploads, agent chaining execution). See [`docs/pre-plan-deferred-features-2026-06-08.md`](docs/pre-plan-deferred-features-2026-06-08.md). Triage alongside the `wip/2026-06-01-pre-adoption` work — most items depend on shape decisions there.

## In flight

- 2026-06-01 — Playbook adoption of `Dragonflow_Agents` itself (this branch, `chore/adopt-playbook`). Once the PR merges, remove this entry.

## Intentionally unfinished

- 2026-06-01 — No `docs/UX/Dragonflow_Agents/Dragonflow_Agents-experience.md` content beyond the *Purpose* and *Audience* sections. Per [`docs/UX/experience.md`](docs/UX/experience.md), feature-walkthrough content follows the build; the rest will be filled in as features land on `main` (not as the WIP triage merges them).
- **No LLM call sites as of 2026-06-08.** When the first LLM is introduced, follow https://github.com/dragonflowio/playbook/blob/main/playbook/agents-table.md and add the project rule per the agent-runtime blueprint's Plan 6 pattern. Remove this row in the same PR that lands the first agents-table row.
- 2026-06-09 — Supabase schema provisioning for `apps/playground/`. The ported management routes assume `agents`, `projects`, `connections`, `models` tables already exist (the wip code never carried migrations). A fresh Supabase project will fail at runtime until these tables are created. Not gated on blueprint Plan 5; capture as its own pre-plan when someone needs to stand the playground up against a fresh DB.
- 2026-06-09 — `wip/2026-06-01-pre-adoption` is still alive. Plan 5-pre-a covered slices A + B; blueprint Plan 5 will replace slice C (the chat surface) and delete slice D (`lib/providers/*`). Delete the branch once Plan 5 merges, on a sweep PR — keeping it around in the meantime so any forgotten salvage stays recoverable.
- 2026-06-09 — Four per-line `react-hooks/set-state-in-effect` disables on prop→state mirror useEffects in `apps/playground/components/{layout/TopNav.tsx, sidebar/ProjectList.tsx, agent/schema/SchemaTab.tsx, agent/config/RawJsonEditor.tsx}`. Originally tagged "refactor planned in Plan 5", but Plan 5 ([`docs/plans/plan-5-playground-rewire-2026-06-09.md`](docs/plans/plan-5-playground-rewire-2026-06-09.md)) scoped itself to the chat surface only — none of these files are on its path. Promote to a backlog row when a separate cleanup pass is appetited.

## Not in scope right now

- _(none yet)_
