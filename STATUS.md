# STATUS.md

> **STATUS.md is data, not rules.** The structural conventions (the four-bucket layout, the active-plans table format, the one-line backlog rule, the pre-plan promotion path) are inlined in [AGENTS.md](AGENTS.md) under the *STATUS.md handling* and *Backlog and pre-plans* sections. Read those at session start; come here for the live entries.

**Last updated:** 2026-06-01

## Active plans

| Plan | Branch | Agent | Last commit | Status |
|---|---|---|---|---|
| _None in flight._ |  |  |  |  |

## Backlog

- 2026-06-01 — Triage [`wip/2026-06-01-pre-adoption`](https://github.com/dragonflowio/agent-playground/tree/wip/2026-06-01-pre-adoption) (~86 files: agents/projects/settings/api routes, lib/adapters, lib/providers, lib/supabase, lib/crypto, additional shadcn UI components, modifications to `app/{globals.css,layout.tsx,page.tsx}`, `next.config.ts`, `package.json`). Decide what to promote to `feat/plan-<N>-<slug>` plans, what to drop, what to extract piecemeal. Don't merge the branch wholesale.

## In flight

- 2026-06-01 — Playbook adoption of `agent-playground` itself (this branch, `chore/adopt-playbook`). Once the PR merges, remove this entry.

## Intentionally unfinished

- 2026-06-01 — No `docs/UX/agent-playground/agent-playground-experience.md` content beyond the *Purpose* and *Audience* sections. Per [`docs/UX/experience.md`](docs/UX/experience.md), feature-walkthrough content follows the build; the rest will be filled in as features land on `main` (not as the WIP triage merges them).

## Not in scope right now

- _(none yet)_
