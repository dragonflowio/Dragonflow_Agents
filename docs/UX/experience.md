# `docs/UX/` — folder guide

> **Sync banner.** This file is an inline copy from [`dragonflowio/playbook → ux-folder.md`](https://github.com/dragonflowio/playbook/blob/main/playbook/ux-folder.md) at commit `a5cc222`, plus project-specific notes at the bottom. Don't edit the synced sections here — open PRs against the playbook. The *Existing docs in this folder* section (and any other project-specific addition) is local and may be edited freely.

## What this folder is for *(synced)*

`docs/UX/` holds **designed-experience documentation**, one file per sub-app. Each file is the canonical source of truth for what its app is supposed to do *from the user's perspective*. Implementation details, system diagrams, redesign proposals, and feature plans belong elsewhere — not here.

If you find yourself wanting to put a plan, a proposal, or a redesign note in this folder, stop and put it under `docs/<area>/plan-...-<date>.md` (or `docs/<area>/pre-plan-...-<date>.md`) instead.

## Layout *(synced)*

```
docs/UX/
├── experience.md                          ← this file (folder guide)
└── <app>/
    ├── <app>-experience.md                ← the experience doc
    ├── archive/                           ← snapshots of materially-changed prior versions
    │   └── YYYY-MM-<app>-experience.md
    └── assets/                            ← screenshots, on-request only
        └── YYYY-MM-<descriptor>.png
```

One sub-app per directory. The experience doc for a sub-app is named `<app>-experience.md` and lives at the root of that sub-app's directory.

## What goes in an experience doc *(synced)*

- **Purpose** — the single question this app helps the user answer. State it as one sentence. Everything else in the doc is in service of that question.
- **Audience** — who uses it, how many, in what context.
- **Entry points** — how users get into the app.
- **The experience (high level)** — screen-by-screen walkthrough framed as *user decisions*, not as system flows.
- **Known gaps** — where the experience doesn't yet support the decision. Be honest.

Optional sections per app: *Related references*, *Assets*, *Archive*.

## What does *not* go in *(synced)*

- Implementation plans → `docs/<area>/plan-<topic>-<YYYY-MM-DD>.md`.
- Pre-plans and sketches → `docs/<area>/pre-plan-<topic>-<YYYY-MM-DD>.md`.
- Architecture diagrams → root-level `docs/` (e.g., `docs/ARCHITECTURE.md`).
- Decision logs → `docs/decisions/` (or in the relevant plan/pre-plan if no `decisions/` folder yet).

## Maintenance rules *(synced)*

1. **Two kinds of content, two different update cadences.**
   - *Customer-insight and decision-basis content* (Purpose, Audience, Known gaps, framing) is kept current as we learn. Update it in real time when something changes about who the user is or how they decide.
   - *Feature-walkthrough content* (the screen-by-screen description of how the app works) follows the build, not the other way around. Do not document a flow before it exists in the app.

2. **When you change user-visible behavior, update the experience doc in the same change.** If a doc doesn't exist yet for the app you're touching, flag it (in `STATUS.md` under *Intentionally unfinished*, or write a stub).

3. **For material changes, archive before overwriting.** Snapshot the prior `<app>-experience.md` to `archive/YYYY-MM-<app>-experience.md` before replacing major sections. Routine edits rely on git history.

4. **Screenshots are on-request only.** Don't generate or commit screenshots unless the user asks. When you do, date them (`YYYY-MM-<descriptor>.png`) and put them under `<app>/assets/`.

## When a sub-app doesn't have an experience doc yet *(synced)*

Flag it in `STATUS.md`. At minimum, write a stub with just the *Purpose* and *Audience* sections so the doc exists and can grow from there. Do not let user-visible work for a sub-app proceed long-term without an experience doc.

## Segments *(synced)*

When an app serves multiple user segments, keep segments as `##` sections inside `<app>-experience.md` until an app delivers materially different experiences to different segments. Only then split into `docs/UX/<app>/segments/<segment>.md`.

## Existing docs in this folder *(project)*

- [`agent-playground/agent-playground-experience.md`](agent-playground/agent-playground-experience.md) — stub (Purpose + Audience only at adoption). Feature-walkthrough content will land as features ship to `main`.
