# AGENTS.md

> **Sync banner.** Sections in this file marked `(synced from playbook → <file>.md)` are inline copies from [`dragonflowio/playbook`](https://github.com/dragonflowio/playbook) at commit `f7d651a`. Don't edit those sections here — open PRs against the playbook. Untagged sections and sections marked `(project)` are specific to this repo.

## What this repo is *(project)*

`Dragonflow_Agents` is a Next.js app for configuring and exercising multi-provider LLM agents. It lets a developer or AI engineer at Dragonflow group agents into projects, configure each agent's prompt / tools / model / voice / Slack channel / next-agent handoff, validate agent output schemas, and try the agent live in a chat-style playground that streams responses and shows tool calls.

The provider layer abstracts Anthropic, Google, and OpenAI behind a single interface (`lib/providers/`); the adapter layer (`lib/adapters/`) abstracts where agent configuration lives ("home" vs "remote" backends, via Supabase under the hood). MCP tool configuration is first-class.

This repo is a **sibling repo** to [`Dragonflow_Core`](https://github.com/dragonflowio/Dragonflow_Core) — it lives in its own GitHub repo and its own filesystem directory, and is not a subdirectory of the umbrella. Cross-cutting org conventions still come from the playbook.

## Rules for agents working in this repo

1. **Read [STATUS.md](STATUS.md) at session start.** *(synced from playbook → agents-md.md)* STATUS.md is this repo's active-state surface: current in-flight plans, backlog, what's intentionally unfinished. Long-form context lives in `docs/` and in plan files.

2. **First action in any session: `git status`.** *(synced from playbook → branch-naming.md)* If the tree is dirty in files you didn't expect to be modified, pause and ask the user before proceeding. Do not silently work around someone else's in-flight changes. If the tree is dirty in files your plan owns, treat that as resumed work on this plan's branch — do not start over.

3. **Check for playbook drift at session start.** *(synced from playbook → syncing.md)* After `git status` and after reading STATUS.md, read the sync banner's commit SHA at the top of this file and compare it against the playbook's [CHANGELOG.md](https://github.com/dragonflowio/playbook/blob/main/CHANGELOG.md). If newer entries exist that carry an **adopters: sync** note, surface them to the user *before* starting other work and ask whether to sync now or defer. Don't sync silently — sync PRs change the AGENTS.md rules an in-flight plan might rely on.

4. **If you are changing user-visible behavior, read [docs/UX/experience.md](docs/UX/experience.md) first.** *(synced from playbook → agents-md.md)* That file is the folder guide for `docs/UX/`. Per-app experience docs at `docs/UX/<app>/<app>-experience.md` are the canonical source of truth for what each app does from the user's perspective. The Dragonflow_Agents experience doc lives at [`docs/UX/Dragonflow_Agents/Dragonflow_Agents-experience.md`](docs/UX/Dragonflow_Agents/Dragonflow_Agents-experience.md).

5. **This is NOT the Next.js you know.** *(project)* This repo runs a Next.js version with breaking changes — APIs, conventions, and file structure may differ from your training data. Before writing or modifying any Next.js code (routes, layouts, server components, middleware, config), read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices. Do not rely on patterns from earlier Next.js versions.

6. **Untriaged pre-adoption work lives on [`wip/2026-06-01-pre-adoption`](https://github.com/dragonflowio/Dragonflow_Agents/tree/wip/2026-06-01-pre-adoption).** *(project)* That branch holds ~86 files of feature scaffolding (the agents/projects/settings/api routes, the lib/adapters and lib/providers/lib/supabase layers, the additional shadcn UI components, etc.) that was uncommitted on `main` at adoption time. Treat it as a backlog of work to triage into real plans (`feat/plan-<N>-<slug>` branches) — not as the starting point for new feature work, and not as code to silently `git merge` into `main`.

## Branch and PR conventions *(synced from playbook → branch-naming.md)*

One branch per plan, one (draft) PR per plan. The branch is the unit of review and the unit of agent handoff.

**Naming:**

- `feat/plan-<N>-<short-slug>` — plan work in an active plan sequence (e.g., `feat/plan-3-thing-page`).
- `fix/<short-slug>` — hotfixes outside the plan sequence.
- `chore/<short-slug>` — housekeeping work (cleanup, migrations not tied to a feature, lint sweeps).
- `wip/<YYYY-MM-DD>-<short-slug>` — parked work that isn't yet a plan. See the `wip/*` section below.

Slugs are lowercase, kebab-case, short. No PII, no secrets, no internal acronyms a reader wouldn't recognize.

**One branch per plan.** Each plan declares its concrete branch name in its header. When you pick up a plan, your first git action is to check out (or create) that branch. If the branch already exists with uncommitted history that doesn't match what you expect: if you wrote that history in a prior session, treat it as resumed work; if you didn't, pause and ask the user.

**One PR per plan.** Open a **draft PR as soon as you have a first commit**, and keep that PR as the review unit for the entire plan. The PR description points back to the plan file. WIP commits are fine — they get squashed at merge time. Mark the PR ready-for-review (un-draft it) only when you finish the Verify phase.

**Chore PRs and meta-only changes.** `chore/` PRs that touch only meta files (`adopters/*`, `STATUS.md`, sync-banner SHA bumps, `CHANGELOG.md`, lint config, `.gitignore`, README clarifications — no code-behavior change) follow a lighter workflow than plan PRs:

- Open as a **normal PR (not draft)**. There is no Verify phase to complete first.
- **The agent that opens the PR also squash-merges it** in the same turn via `gh pr merge --squash --delete-branch`, and reports the merged state. No "is this ready?" round-trip — the diff is the whole story.
- **Stop and ask only when:** (a) the diff includes anything outside pure meta files; (b) the PR is in a different repo than the one the agent is operating in (cross-repo PRs lose context — confirm before merging); (c) the agent has any uncertainty about what the diff does. End the turn with: *"Ready to squash-merge — confirm? (chore PR — [reason for asking])"*.
- **Never leave a chore PR hanging.** A chore PR opened and silently dropped is the failure mode this rule exists to prevent.

This does **not** apply to `feat/plan-*` PRs (they follow the *Plan lifecycle* two-pause-point rule below and need user say-so at *Review & merge*) or to `fix/*` PRs (those touch code and need real review).

## Plan drafting *(synced from playbook → plan-drafting.md)*

Companion to *Plan lifecycle* below. The full guidance (with examples and common mistakes) is in [`playbook/plan-drafting.md`](https://github.com/dragonflowio/playbook/blob/main/playbook/plan-drafting.md); the principles every drafter should keep in mind:

- **Promote a pre-plan to a plan only when** the open questions are answered, the Implementation Steps are concrete, and there's a place in the sequence (or it's clearly standalone). Otherwise, finish the investigation steps first.
- **Goal** — one paragraph, framed as a user-visible outcome where possible. Vague goals produce vague plans.
- **Scope** — state both in-scope AND out-of-scope. Out-of-scope keeps the plan from sprawling mid-execution.
- **Implementation Steps** — each is one coherent change with enough specificity (file paths, function names, line numbers) that the next agent doesn't have to re-design. Too small if the step text would be the commit message; too large if a fresh agent can't execute it without further interpretation.
- **Acceptance Criteria** — each independently verifiable. Cover regression cases, not just improvements (e.g., "X now works" AND "existing Y doesn't regress").
- **Split a plan** when the PR would be too large to review meaningfully, when there's a natural milestone in the middle, or when different agents could work in parallel.

Don't leave open questions in Implementation Steps — decisions belong in the pre-plan, not in execution.

## Plan lifecycle *(synced from playbook → plan-lifecycle.md)*

An *implementation plan* has **six phases**. The plan is *implemented* (and *done*) only when all six are complete:

1. **Code** — write and commit the source changes.
2. **Migrate** — *apply* any migrations, seed scripts, or production-state changes the plan introduces. Writing the migration file is part of Code; running it against the live system is Migrate and is its own phase.
3. **Verify** — walk through every acceptance criterion in the plan's *Acceptance Criteria* section and report pass/fail with evidence.
4. **Review & merge** — the PR is reviewed, marked ready-for-review, and merged to main.
5. **STATUS update** — the plan's row is removed from `STATUS.md` *Active plans*.
6. **Handoff** — the next plan path is given to the user per the plan's *Handoff to next plan* section.

**Vocabulary — use these words precisely:**

- **"Implemented"** / **"done"** — *all six* phases complete. Do not use these otherwise.
- **"Code phase complete"** — phase 1 done, phases 2–6 ahead.
- **"Implementation complete through phase N"** — phases 1..N done.

**Drive the lifecycle automatically.** Walking the plan through all six phases is *your job*, not the user's. Do not stop after one phase and wait for them to ask "what's next?"

**The two pause points** — only these phases require the user before you can continue:

- **Migrate.** After Code is complete, report the migration's DDL summary, what it touches, whether anything is irreversible, and the rollback. Then wait for "go ahead." Once authorized, apply it and continue immediately to Verify.
- **Review & merge.** After Verify passes, prep the PR (description summarizing the change, link to the plan file, list of applied migrations, notes on any unrelated pre-existing test/lint failures), mark it ready-for-review, and tell the user. Then wait for the user to confirm the PR is merged.

**Everything else you execute without being prompted** — Code happens as the plan work; Verify happens immediately after Code (mark Migrate-dependent criteria as "Blocked on Migrate phase" rather than fail, then re-walk them after Migrate); STATUS update happens immediately after the user confirms the merge; Handoff happens immediately after STATUS update.

**Never apply migrations silently.** Writing a migration file is implementation work. Applying it is a deliberate, consequential operation on shared state. Always ask before applying, and surface what will change.

## Plan sequence *(synced from playbook → plan-sequence.md)*

When multiple plans depend on each other, they form a **plan sequence**. Every plan in the sequence carries two sections at the bottom of the file:

- **Plan Sequence** — the locked-in order across the sequence. Listed in every plan so any agent can confirm position. When the sequence spans multiple repos, say which repo each plan lives in.
- **Handoff to next plan** — the closing step of phase 6 of the lifecycle. Format:

  > **Next plan path:** `docs/<area>/plan-thing-YYYY-MM-DD.md` (this repo, `<repo-name>`) — short note on what's next.

Before starting work, an agent picking up a plan reads the plan's header, confirms the branch matches the naming convention, reads the *Plan Sequence* section, and confirms earlier prerequisites are done. If prerequisites are missing, stop and ask — don't quietly skip ahead.

When a plan is dropped, reordered, or split, update the *Plan Sequence* section in **every** other plan in the sequence in the same PR.

## STATUS.md handling *(synced from playbook → status-md.md)*

`STATUS.md` has **four buckets**, in this order:

1. **Active plans** — table of plans currently in flight.
2. **Backlog** — work we want to do but haven't started.
3. **In flight** — cross-cutting efforts that don't fit a single plan.
4. **Intentionally unfinished** — known gaps that aren't scheduled and that's OK.
5. **Not in scope right now** — work explicitly out of scope.

Do not invent additional buckets without a PR against the playbook.

**Active plans table format:**

```
| Plan | Branch | Agent | Last commit | Status |
|---|---|---|---|---|
| Plan N — short name | feat/plan-<N>-<slug> | agent-name | YYYY-MM-DD | one-line status |
```

When no plan is active, replace the table body with `_None in flight._`. When a plan completes, **remove its row** — the plan file itself is the permanent record.

**Backlog** — one line per entry. Date each. If an entry grows past ~50 words, promote it to a pre-plan file (see *Backlog and pre-plans* below) and shrink the backlog entry to a one-line pointer.

## Backlog and pre-plans *(synced from playbook → backlog-and-pre-plans.md)*

The promotion path for future work: idea → one-line backlog entry → pre-plan file → real plan with branch and PR.

1. **Idea → one-line entry in `STATUS.md` *Backlog*.** Date it. Include enough context to remember the *why* later.
2. **Entry grows past ~50 words → pre-plan file.** Create `docs/pre-plan-<topic>-<YYYY-MM-DD>.md` (or `docs/<area>/pre-plan-<topic>-<YYYY-MM-DD>.md` for area-specific work). Shrink the backlog entry to a one-line pointer to the file.
3. **Pre-plan ripens into real work → promote to a plan.** Rename to `plan-<topic>-<YYYY-MM-DD>.md`, give it a branch per the naming convention, add it to the *Plan Sequence* section of every other plan in the sequence, and move it from *Backlog* to *Active plans*.
4. **When a plan completes, remove its row from *Active plans*.** Phase 5 of the lifecycle.

Don't put new work in code comments, chat scratchpads, or undated docs. Those locations have no readers and the work will get lost.

## Secrets *(synced from playbook → secrets.md)*

**Never commit secrets to any branch.** This includes `main`, feature branches, and `wip/*` branches. API tokens, Bearer credentials, database passwords, signing keys, OAuth client secrets, service-account JSON, and any other credential are out — always.

Secrets belong in a gitignored local file (`.env.local`, `.mcp.local.json`, etc.), in a secret manager, or as an environment-variable substitution that resolves at runtime.

**Template files for tool config:** the real config (e.g., `.mcp.json`) is gitignored. A template (e.g., `.mcp.example.json`) is committed with placeholder values. The repo's README explains: "copy `.mcp.example.json` to `.mcp.json` and fill in your own credentials."

**If a secret is exposed:** (1) do not push the branch if not already pushed, (2) flag it to the user immediately, (3) rotate the credential — the old one is compromised regardless of how briefly the commit existed, (4) clean the history, (5) document the incident. **Rotate first, scrub second.**

**Before pushing any branch, scan for credentials.** A starting point:

```
git diff origin/main..HEAD | grep -iE '(secret|token|password|key|bearer)'
```

If anything matches, inspect the line. If unsure whether a value is sensitive, treat it as sensitive.

## `wip/*` branches *(synced from playbook → wip-branches.md)*

`wip/*` branches park work that isn't yet a plan. Naming: `wip/<YYYY-MM-DD>-<short-slug>`.

**Must push to origin immediately.** A `wip/*` branch that lives only on one machine is invisible to every other agent — and to you, on a different clone. Push it (`git push -u origin wip/<branch-name>`) the moment it exists. **Scan for secrets first** (see *Secrets* above); if any are present, do not push until they're removed and any exposed credential is rotated.

**No session ends with uncommitted work in files you touched.** Before signing off, either commit (to your plan's branch — WIP commits are fine) or move the work to a `wip/*` branch with a clear message. The next agent in this repo should never have to interpret a dirty tree. Stashes are allowed (`git stash push -m "agent-handoff: plan-N short description"`) but branches are preferred — stashes are easy to lose.

`wip/*` branches do not have a fixed end date but should be triaged when work resumes (promote to `feat/`/`fix/`/`chore/`), when the work is dead (delete the branch), or during a cleanup pass.

## How conventions evolve *(synced from playbook → how-conventions-evolve.md)*

If you notice something during work that feels like it should be a convention:

1. **Flag it.** Either in this repo's `STATUS.md` *Backlog* (one-line entry, dated), or upstream in the playbook's `STATUS.md` under *Candidate conventions*.
2. **Wait for the pain to be felt at least twice.** One observation can be a fluke. Exception: rules that prevent real harm (e.g., secrets) go in immediately.
3. **Open a PR against [`dragonflowio/playbook`](https://github.com/dragonflowio/playbook).** Ground the change in real evidence: which repo(s), which session(s), what specifically went wrong, what rule prevents recurrence.
4. **After the PR merges**, re-sync this `AGENTS.md` (see [`playbook/syncing.md`](https://github.com/dragonflowio/playbook/blob/main/playbook/syncing.md)).

If a candidate is project-specific (does not generalize), add it as a rule under *Rules for agents working in this repo* above as a `(project)` rule, not upstream.

## Open conventions *(project, optional)*

- _(none yet)_
