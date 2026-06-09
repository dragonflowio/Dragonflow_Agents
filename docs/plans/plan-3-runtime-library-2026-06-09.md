---
kind: feature
autonomy: needs-checkpoints
status: completed
completed_on: 2026-06-09
repos:
  - Dragonflow_Agents
---

# Plan 3 — `@dragonflowio/agent-runtime@0.1.0` published from `Dragonflow_Agents`

<!--
  Filename: plan-3-runtime-library-2026-06-09.md.
  See: dragonflowio/playbook → playbook/plan-lifecycle.md and playbook/plan-sequence.md.

  The YAML frontmatter above is the queryable surface; the prose block below is the human
  reading surface. Phase 5 flips both to `completed` in the same commit that removes the
  STATUS.md row.
-->

**Status:** Completed 2026-06-09 ([Dragonflow_Agents#6](https://github.com/dragonflowio/Dragonflow_Agents/pull/6), [#7](https://github.com/dragonflowio/Dragonflow_Agents/pull/7))
**Created:** 2026-06-09
**Repo:** `Dragonflow_Agents`
**Branch:** `feat/plan-3-runtime-library` (merged)
**Intended owner:** One implementation agent
**Related:**
- [Agent-runtime blueprint (2026-06-06)](https://github.com/dragonflowio/playbook/blob/main/docs/agent-runtime-blueprint-2026-06-06.md) — Plan 3's spec in the eight-plan thread.
- [`playbook/agent-invocation-contract.md`](https://github.com/dragonflowio/playbook/blob/main/playbook/agent-invocation-contract.md) — the v0.1 contract this library implements.
- [`playbook/agents-table.md`](https://github.com/dragonflowio/playbook/blob/main/playbook/agents-table.md) — the per-project Supabase schema the runtime loads from.
- Plan 2 — [`docs/plans/plan-2-agent-runtime-conventions-2026-06-06.md`](https://github.com/dragonflowio/playbook/blob/main/docs/plans/plan-2-agent-runtime-conventions-2026-06-06.md) (playbook, merged 2026-06-09).
- Pre-Plan-3 housekeeping — [#5 chore: rename agent-playground -> Dragonflow_Agents](https://github.com/dragonflowio/Dragonflow_Agents/pull/5) (merged 2026-06-09).

## Goal

`@dragonflowio/agent-runtime@0.1.0` exists on public npm. Any Node.js consumer can `npm install @dragonflowio/agent-runtime`, register tools, and call `invoke({ slug, input })` against a per-project `agents` Supabase table, exactly as documented in [`agent-invocation-contract.md`](https://github.com/dragonflowio/playbook/blob/main/playbook/agent-invocation-contract.md). The `Dragonflow_Agents` repo is restructured into a pnpm workspace so the library lives next to (and is independently published from) the playground app — making contract drift between the two impossible.

## Scope

In scope:

- Restructure `Dragonflow_Agents` into a pnpm workspace layout: `packages/runtime/` (the new library) and `apps/playground/` (the existing Next.js app, relocated as-is).
- Implement `@dragonflowio/agent-runtime@0.1.0` against the v0.1 contract: multi-provider (Anthropic + Google + OpenAI) `invoke` entry point, agent-row loader by slug with caching option, Zod tool registry, structured-output parsing (fence-strip → `JSON.parse` → Zod validate), discriminated `RuntimeError` envelope, `serializeError` helper.
- Build config (`tsup`) producing ESM + CJS + `.d.ts` from `packages/runtime/`.
- Tests against in-memory fixture `agents` rows using `vitest`. Provider HTTP calls are mocked at the `fetch` boundary; no real Supabase, no real LLM traffic.
- GitHub Actions publish workflow that runs on `v*` tag push and publishes to public npm. The workflow file ships in this PR; the first publish is the eyes-on pause point — the workflow does not run automatically as part of this PR's merge.
- `packages/runtime/package.json` declares `name: @dragonflowio/agent-runtime`, `publishConfig.access: public`, `repository`, `license: MIT`, and the proper `main` / `module` / `types` / `exports` entries.
- A short `packages/runtime/README.md` documenting install, env contract, and the `invoke` surface (one example per provider).

Out of scope:

- **Rewiring the playground onto the new library.** Plan 5 owns that. Plan 3 leaves the playground untouched aside from the directory move and any wiring fixes the move requires.
- **Triaging [`wip/2026-06-01-pre-adoption`](https://github.com/dragonflowio/Dragonflow_Agents/tree/wip/2026-06-01-pre-adoption).** That branch's ~86 files (additional UI, agents/projects/settings routes, lib/adapters, full lib/providers, lib/supabase) are a separate STATUS.md backlog item. The library implements its provider abstraction fresh against the v0.1 contract; the WIP `lib/providers/` code is a useful reference but the contract's surface differs (`invoke` returning `{ output, raw, usage }` rather than `streamChat` yielding `StreamChunk`), so this plan does not lift it wholesale.
- **Streaming.** The v0.1 contract is non-streaming. Streaming is a future minor bump or a follow-up plan.
- **Real LLM-traffic end-to-end tests.** Plan 4 (pilot adoption) is the contract pressure-test. Plan 3's tests verify the library implements the contract; Plan 4 verifies the contract survives real production code.
- **Publishing to a private registry.** Public npm only, per locked decision #11.
- **Multi-tenant / multi-project library hosting.** Each consumer constructs one runtime instance per project's Supabase.

## Implementation Steps

1. **Promote the plan.** Branch `feat/plan-3-runtime-library`, commit this plan file under `docs/plans/`, open a draft PR pointing back at this file. Add the row to `STATUS.md` *Active plans*.

2. **Workspace restructure.** Add `pnpm-workspace.yaml`:
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```
   Move existing `app/`, `components/`, `lib/`, `public/`, `next.config.ts`, `tsconfig.json`, `next-env.d.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json` into `apps/playground/`. Move the existing root `package.json`'s app deps and scripts into `apps/playground/package.json` (`name: @dragonflow-agents/playground`, `private: true`). Create a new root `package.json` that only carries workspace metadata + the dev tooling needed at root (no runtime deps). Drop `package-lock.json` and `node_modules/` at root; pnpm will produce `pnpm-lock.yaml`. Update `.gitignore` for `pnpm-lock.yaml` (kept), `node_modules` (already ignored).

3. **Library scaffolding.** Create `packages/runtime/` with:
   - `package.json` — `name: @dragonflowio/agent-runtime`, `version: 0.1.0`, `license: MIT`, `repository`, `publishConfig: { access: public }`, `main: dist/index.cjs`, `module: dist/index.js`, `types: dist/index.d.ts`, `exports: { ".": { import, require, types } }`, `files: ["dist", "README.md"]`. Peer-deps: `zod ^3.23.0`, `@supabase/supabase-js ^2.0.0`. Dev-deps: `tsup`, `vitest`, `typescript`, `@types/node`.
   - `tsconfig.json` — `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `declaration: true`, `strict: true`, `noEmit: true` (tsup emits).
   - `tsup.config.ts` — entry `src/index.ts`, format `["esm", "cjs"]`, `dts: true`, `clean: true`, target `node18`.
   - `vitest.config.ts` — node environment, `include: ["src/**/*.test.ts"]`.
   - `README.md` — install, env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, plus per-provider API key envs), one example per provider, link to the contract.

4. **Implement the public surface (`packages/runtime/src/index.ts`).** Re-exports the named exports:
   - `createRuntime(opts)` → `{ invoke, loader, registry }`. `opts` accepts a pre-constructed `SupabaseClient` *or* `{ supabaseUrl, supabaseServiceRoleKey }`; plus an optional `cache: { ttlMs }` and `provider: { fetch?: typeof fetch }` (injectable for tests).
   - `createToolRegistry()` → `ToolRegistry`.
   - Types: `InvokeArgs`, `InvokeResult`, `ToolRegistry`, `ToolHandler`, `ToolContext`, `RuntimeError`, `AgentRow`.
   - Helper: `serializeError(err)`.

5. **Implement agent-row loader (`packages/runtime/src/loader.ts`).** Reads `name, model, system_instruction, config` from `public.agents` via the canonical lookup query in `agents-table.md`. Caches by slug with the configured TTL (default: no cache, matching Canvas + Admin's behavior; Plan 4 may revisit). Cache invalidation is process-restart only — no manual flush API in v0.1. Maps any failure to `{ type: 'load', slug, cause }`.

6. **Implement provider abstraction (`packages/runtime/src/providers/`).** One file per provider — `anthropic.ts`, `openai.ts`, `google.ts` — each exposing `generate({ system, messages, model, max_tokens, tools, signal, fetch }) → { content, toolCalls, usage }`. Non-streaming. Provider selection is by `config.provider` on the agent row. API keys come from env (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`). Failures bubble as `{ type: 'provider', cause }`.

7. **Implement `invoke` (`packages/runtime/src/invoke.ts`).** Glues loader + provider + tool registry + structured-output parsing:
   - Loads agent row by slug.
   - Resolves the `messages` array from `input` (string shorthand → single user message; `{ messages, system? }` → as-is, with `system` override).
   - Calls the provider's `generate`.
   - If the call returns tool calls, executes each via the registry's handler in parallel; appends results as `tool` messages; loops. Tool-handler failures bubble as `{ type: 'tool', name, cause }`. Maximum loop iterations: 5 (hard cap; configurable later via candidate convention).
   - If the consumer supplied a `schema`, runs the contract's parse pipeline: strip ```` ```json ```` fence if present, `JSON.parse`, Zod `safeParse`. Failures map to `{ type: 'parse', raw, cause }` or `{ type: 'validate', raw, cause }`.
   - Returns `{ output, raw, usage }`.

8. **Implement tool registry (`packages/runtime/src/registry.ts`).** `register(name, { description, schema, handler })`; `list()`; internal `get(name)` for `invoke`. Schema is a Zod schema. Handler is `async (input, ctx: { signal }) => output`.

9. **Implement error envelope (`packages/runtime/src/errors.ts`).** `RuntimeError` discriminated union per the contract (`load | provider | parse | validate | tool`). `serializeError` returns `{ type, message, slug? | name? | raw? }` — JSON-serializable for the existing `agent_invocations` audit-log pattern.

10. **Tests (`packages/runtime/src/**/*.test.ts`).** Cover:
    - **Loader** — fixture supabase client returns a row; missing slug throws as `load`; missing `model` throws as `load`; cache TTL respected.
    - **Tool registry** — register/get/list; duplicate registration throws.
    - **Provider mocks** — each provider's `generate` exercises happy-path and error-path against a stubbed `fetch`. Verifies headers, body shape, tool serialization.
    - **`invoke` happy paths** — single-turn plain-text agent; single-turn structured-output agent; tool-using agent that loops once.
    - **`invoke` error paths** — load failure → `load`; provider 500 → `provider`; structured output that's not JSON → `parse`; valid JSON that fails Zod → `validate`; tool handler throws → `tool`.

11. **Build + publish wiring.**
    - `packages/runtime/`: `pnpm build` runs `tsup`. `pnpm test` runs `vitest`. `pnpm typecheck` runs `tsc --noEmit`.
    - Root `package.json`: scripts `build` (`pnpm -r build`), `test` (`pnpm -r test`), `typecheck` (`pnpm -r typecheck`).
    - `.github/workflows/publish-runtime.yml`: on `push` of tag matching `v*`, checks out the repo, installs pnpm (via `pnpm/action-setup`), runs `pnpm install --frozen-lockfile`, runs `pnpm -F @dragonflowio/agent-runtime build` + `test`, runs `npm publish --provenance` from `packages/runtime/`. Uses `NPM_TOKEN` secret (user adds at pause point #1).

12. **Verify locally.** `pnpm install && pnpm build && pnpm test && pnpm typecheck` all green. `cd packages/runtime && npm publish --dry-run` produces a valid tarball; captured into the PR description. `cd apps/playground && pnpm dev` still serves the existing skeleton page (regression check — Plan 3 must not break the playground; Plan 5 is what changes it).

13. **Pause point #1 — npm `@dragonflowio` scope claim.** Halt with a one-liner reporting (a) the dry-run output, (b) the workflow file path, (c) the exact action the user must take: claim the `@dragonflowio` org on npmjs.com (free), create an automation token, add it as `NPM_TOKEN` repo secret. Resume only after user confirms.

14. **Pause point #2 — first publish.** Push the `v0.1.0` tag on the merge commit, watch the workflow, report the published-package URL (`https://www.npmjs.com/package/@dragonflowio/agent-runtime`). Verify resolvability with `npm view @dragonflowio/agent-runtime version` from any machine.

15. **STATUS update + handoff (phase 5 + 6).** After user confirms merge and publish: flip this plan's frontmatter to `status: completed`, `completed_on: 2026-06-DD`; remove the row from `STATUS.md` *Active plans*; hand the user Plan 4's path in `Dragonflow_Canvas` (the pilot).

## Acceptance Criteria

- `pnpm install && pnpm -r build` is green on a fresh clone of the merge commit.
- `pnpm -F @dragonflowio/agent-runtime test` is green; coverage includes every contract surface listed in step 10.
- `pnpm -F @dragonflowio/agent-runtime typecheck` is green.
- `cd packages/runtime && npm publish --dry-run` produces a valid tarball; the dry-run summary is captured in the PR description.
- `packages/runtime/package.json` declares `name: @dragonflowio/agent-runtime`, `version: 0.1.0`, `publishConfig.access: public`, `license: MIT`, `repository`, and explicit `main` / `module` / `types` / `exports` entries.
- The library's public API matches [`playbook/agent-invocation-contract.md`](https://github.com/dragonflowio/playbook/blob/main/playbook/agent-invocation-contract.md) v0.1 exactly: `invoke` signature, tool-registry shape, structured-output parse pipeline, `RuntimeError` discriminated union with all five variants.
- After pause point #2: `@dragonflowio/agent-runtime@0.1.0` is published to public npm and resolvable via `npm view @dragonflowio/agent-runtime` from any machine.
- A git tag `v0.1.0` exists on the merge commit; the publish workflow ran on that tag and succeeded.
- `cd apps/playground && pnpm dev` builds and serves the existing skeleton page — regression check that Plan 3 did not break the playground.
- `packages/runtime/README.md` documents install, env vars, and one `invoke` example per provider, with a link to the playbook contract.

## Plan Sequence

This is the locked-in order across the agent-runtime thread (blueprint: [`docs/agent-runtime-blueprint-2026-06-06.md`](https://github.com/dragonflowio/playbook/blob/main/docs/agent-runtime-blueprint-2026-06-06.md) in `playbook`). Every plan in the sequence carries this same section so any agent can confirm position and hand the next path back to the user.

1. **Plan 0 — Move off-table LLM calls onto per-project `agents` table** — parallel, one per consuming repo (path `docs/plans/plan-0-…-2026-06-06.md` in each repo). Several repos complete (Canvas, Product, Titos, Admin); `Dragonflow_Core` + `Dragonflow_Studio` dropped as bucket C; `Proveedores-Data-Ingestion` + `Proveedores-Layers` de-facto bucket C.
2. **Plan 1 — Audit each consuming repo's agent invocation** — parallel; four merged audits (`Dragonflow_Canvas`, `Dragonflow_Product`, `Titos_Automations`, `Proveedores-Admin`).
3. **Plan 2 — Playbook conventions + pilot decision** — [`docs/plans/plan-2-agent-runtime-conventions-2026-06-06.md`](https://github.com/dragonflowio/playbook/blob/main/docs/plans/plan-2-agent-runtime-conventions-2026-06-06.md) (playbook, merged). Wrote `agents-table.md` + `agent-invocation-contract.md`; pilot = `Dragonflow_Canvas`.
4. **Plan 3 — `@dragonflowio/agent-runtime@0.1.0` published from `Dragonflow_Agents`** — this file (`Dragonflow_Agents`). Workspace restructure + library implementation + first public-npm publish.
5. **Plan 4 — Pilot adoption (single repo, contract pressure test)** — the pilot, `Dragonflow_Canvas`. Migrates Canvas's bespoke invocation code to `@dragonflowio/agent-runtime`; produces a contract gap log; blocking gaps bump the library before merge.
6. **Plan 5 — Playground rewired onto `@dragonflowio/agent-runtime`** — `Dragonflow_Agents`. Parallel with Plan 6.
7. **Plan 6 — Fan-out adoption across remaining consuming repos** — parallel; one per remaining LLM-using repo. Parallel with Plan 5.
8. **Plan 7 — Promote conventions from candidate to standard** — `playbook`. Closes the thread; flips the blueprint's `Status:` to `done`.

## Handoff to next plan

When this plan is implemented and verified, hand the user this path so they can start the next plan with a fresh agent:

> **Next plan path:** `docs/plans/plan-4-agent-runtime-pilot-2026-06-DD.md` in [`Dragonflow_Canvas`](https://github.com/dragonflowio/Dragonflow_Canvas). Plan 4 migrates Canvas's bespoke agent-invocation code onto `@dragonflowio/agent-runtime@^0.1.0` and produces the contract gap log (`docs/agent-runtime-pilot-gaps.md`). If blocking library-level gaps surface, expect a `v0.2.0` bump in `Dragonflow_Agents` before Plan 4's PR merges.
