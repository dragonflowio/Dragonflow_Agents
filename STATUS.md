# STATUS.md

> **STATUS.md is data, not rules.** The structural conventions (the four-bucket layout, the active-plans table format, the one-line backlog rule, the pre-plan promotion path) are inlined in [AGENTS.md](AGENTS.md) under the *STATUS.md handling* and *Backlog and pre-plans* sections. Read those at session start; come here for the live entries.

**Last updated:** 2026-06-09

## Active plans

| Plan | Branch | Agent | Last commit | Status |
|---|---|---|---|---|
| Runtime 0.3.0 — id-lookup + retry + skipLLM | feat/runtime-0.3.0-id-lookup-retry-skip-llm | claude | 2026-06-09 | Code complete; Verify passed; PR ready-for-review |

## Backlog
- 2026-06-09 — `@dragonflowio/agent-runtime` releases should run through CI (GitHub Actions) so npm provenance works. The 0.2.1 release ([#16](https://github.com/dragonflowio/Dragonflow_Agents/pull/16)) was published manually with `--provenance=false` because OIDC isn't available outside CI; the package.json still has `publishConfig.provenance: true` which is now misleading. Either add a release workflow or drop the flag.
- 2026-06-08 — Six post-v1 deferred features from the original phase 1–4 effort (voice session recording, agentic agent creation, `prompt_id` fetch from OpenAI prompt store, prompt versioning, large file uploads, agent chaining execution). See [`docs/pre-plan-deferred-features-2026-06-08.md`](docs/pre-plan-deferred-features-2026-06-08.md). Triage when one of the features is needed; the original "alongside `wip/2026-06-01-pre-adoption`" hint is moot now that Plans 5-pre-a and 5 absorbed that work.

## In flight

- 2026-06-01 — Playbook adoption of `Dragonflow_Agents` itself (this branch, `chore/adopt-playbook`). Once the PR merges, remove this entry.

## Intentionally unfinished

- 2026-06-01 — No `docs/UX/Dragonflow_Agents/Dragonflow_Agents-experience.md` content beyond the *Purpose* and *Audience* sections. Per [`docs/UX/experience.md`](docs/UX/experience.md), feature-walkthrough content follows the build; the rest will be filled in as features land on `main` (not as the WIP triage merges them).
- **No LLM call sites as of 2026-06-08.** When the first LLM is introduced, follow https://github.com/dragonflowio/playbook/blob/main/playbook/agents-table.md and add the project rule per the agent-runtime blueprint's Plan 6 pattern. Remove this row in the same PR that lands the first agents-table row.
- 2026-06-09 — Supabase schema provisioning for `apps/playground/`. The ported management routes assume `agents`, `projects`, `connections`, `models` tables already exist (the wip code never carried migrations). A fresh Supabase project will fail at runtime until these tables are created. Not gated on blueprint Plan 5; capture as its own pre-plan when someone needs to stand the playground up against a fresh DB.
- 2026-06-09 — Four per-line `react-hooks/set-state-in-effect` disables on prop→state mirror useEffects in `apps/playground/components/{layout/TopNav.tsx, sidebar/ProjectList.tsx, agent/schema/SchemaTab.tsx, agent/config/RawJsonEditor.tsx}`. Originally tagged "refactor planned in Plan 5", but Plan 5 ([`docs/plans/plan-5-playground-rewire-2026-06-09.md`](docs/plans/plan-5-playground-rewire-2026-06-09.md)) scoped itself to the chat surface only — none of these files are on its path. Promote to a backlog row when a separate cleanup pass is appetited.

## Not in scope right now

- _(none yet)_
