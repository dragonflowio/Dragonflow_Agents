# STATUS.md

> **STATUS.md is data, not rules.** The structural conventions (the four-bucket layout, the active-plans table format, the one-line backlog rule, the pre-plan promotion path) are inlined in [AGENTS.md](AGENTS.md) under the *STATUS.md handling* and *Backlog and pre-plans* sections. Read those at session start; come here for the live entries.

**Last updated:** 2026-06-09

## Active plans

| Plan | Branch | Agent | Last commit | Status |
|---|---|---|---|---|
| _None in flight._ |  |  |  |  |

## Backlog

- 2026-06-09 — Triage [`wip/2026-06-01-pre-adoption`](https://github.com/dragonflowio/Dragonflow_Agents/tree/wip/2026-06-01-pre-adoption) — slicing laid out in [`docs/pre-plan-wip-triage-2026-06-09.md`](docs/pre-plan-wip-triage-2026-06-09.md) (Plan 5-pre-a port + blueprint Plan 5 rewire). Awaiting promotion.
- 2026-06-08 — Six post-v1 deferred features from the original phase 1–4 effort (voice session recording, agentic agent creation, `prompt_id` fetch from OpenAI prompt store, prompt versioning, large file uploads, agent chaining execution). See [`docs/pre-plan-deferred-features-2026-06-08.md`](docs/pre-plan-deferred-features-2026-06-08.md). Triage alongside the `wip/2026-06-01-pre-adoption` work — most items depend on shape decisions there.

## In flight

- 2026-06-01 — Playbook adoption of `Dragonflow_Agents` itself (this branch, `chore/adopt-playbook`). Once the PR merges, remove this entry.

## Intentionally unfinished

- 2026-06-01 — No `docs/UX/Dragonflow_Agents/Dragonflow_Agents-experience.md` content beyond the *Purpose* and *Audience* sections. Per [`docs/UX/experience.md`](docs/UX/experience.md), feature-walkthrough content follows the build; the rest will be filled in as features land on `main` (not as the WIP triage merges them).
- **No LLM call sites as of 2026-06-08.** When the first LLM is introduced, follow https://github.com/dragonflowio/playbook/blob/main/playbook/agents-table.md and add the project rule per the agent-runtime blueprint's Plan 6 pattern. Remove this row in the same PR that lands the first agents-table row.

## Not in scope right now

- _(none yet)_
