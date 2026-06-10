---
kind: feature
autonomy: needs-checkpoints
status: in_progress
repos:
  - Dragonflow_Agents
---

# Plan — `@dragonflowio/agent-runtime@0.3.0` (id-lookup + retry + skipLLM)

<!--
  Filename: plan-runtime-0.3.0-2026-06-09.md.
  See: dragonflowio/playbook → playbook/plan-lifecycle.md and playbook/plan-sequence.md.

  Frontmatter is the queryable surface; the prose block below is the human reading
  surface. Phase 5 flips both to `completed` in the same commit that removes the
  STATUS.md row.
-->

**Status:** In progress
**Created:** 2026-06-09
**Repo:** `Dragonflow_Agents`
**Branch:** `feat/runtime-0.3.0-id-lookup-retry-skip-llm`
**Intended owner:** One implementation agent
**Related:**
- [`playbook/agent-invocation-contract.md` → *Candidate amendments for 0.3*](https://github.com/dragonflowio/playbook/blob/main/playbook/agent-invocation-contract.md#candidate-amendments-for-03-still-queued) — the spec this minor implements.
- [Agent-runtime blueprint (2026-06-06)](https://github.com/dragonflowio/playbook/blob/main/docs/agent-runtime-blueprint-2026-06-06.md) — thread context. This is a post-Plan-7 follow-up release, not a thread plan.
- [`packages/runtime/CHANGELOG.md`](../../packages/runtime/CHANGELOG.md) — per-version release log; 0.3.0 entry lands here.
- Prior bugfix releases — [#16 (0.2.1)](https://github.com/dragonflowio/Dragonflow_Agents/pull/16), [#18 (0.2.2)](https://github.com/dragonflowio/Dragonflow_Agents/pull/18), [#19 (0.2.3)](https://github.com/dragonflowio/Dragonflow_Agents/pull/19).

## Goal

`@dragonflowio/agent-runtime@0.3.0` lands the three queued candidate amendments from the v0.1 invocation contract — `{ id }`-form `invoke`, the richer `retry` policy (`json-repair`), and the `skipLLM` deterministic-bypass hatch — so `Dragonflow_Input`'s Plan 6 adoption can resume against `^0.3.0` and `Titos-Inventario`'s drafter / CI shapes are first-class. All three additions are surface-additive: pinned `^0.2.x` consumers keep working untouched.

## Scope

In scope:

- `InvokeArgs` widens to `{ slug?: string } | { id?: string }` (exactly one required). Both-set or neither-set is a runtime error.
- `AgentLoader` gains `byName(slug)` and `byId(id)` (existing `load(slug)` stays as an alias for `byName` so 0.2.x consumers calling the loader directly don't break). Cache keys partition by lookup mode so a row fetched by id and the same row fetched by slug occupy separate cache slots (no cross-contamination of stale entries).
- `InvokeArgs.retry?: 'none' | 'reprompt-with-error' | 'json-repair'`. The existing `retryOnParseError: boolean` stays accepted at the boundary and maps `true → 'reprompt-with-error'`, `false → 'none'`. The new `'json-repair'` shape re-prompts as `[…priorTurns, assistant(<bad raw>), user("That wasn't valid JSON ($error). Return it corrected.")]`, re-parses; a second failure throws the original error variant unchanged.
- `createRuntime({ skipLLM?: boolean | (slug: string) => InvokeResult })`. `true` looks up a per-agent fixture (either registered at boot or via `row.config.skip_llm_fixture`); a function lets the consumer drive the bypass per slug. Picks up `process.env.SKIP_LLM === '1'` when no constructor value is set — matches Titos-Inventario's existing env-var hatch so adopters migrating off it don't change names.
- CHANGELOG `0.3.0` entry attributing each amendment to its source audit (`Dragonflow_Input` Plan 1 audit for `{ id }`; `Titos-Inventario` Plan 1 audit for retry + skipLLM).
- Tests: loader byId path mirroring byName (per-provider where the existing pattern is split, otherwise at the loader level); `invoke.test.ts` adds the `{ id }` form, exactly-one-of validation, json-repair retry round trip, and skipLLM boolean + function cases.
- Version bump in `packages/runtime/package.json` (0.2.3 → 0.3.0).

Out of scope:

- The 4th candidate amendment (`InvokeInput.content` accepts file parts). Three was the queued set; opportunistic expansion is a separate decision per the user's guardrail.
- Changes to the error envelope shape, the Boundary table, the tool-registry shape, or any other 0.2.x surface.
- Folding the candidate-amendments section out of the playbook contract body. That is the cross-repo follow-up chore PR opened separately once `0.3.0` publishes (see *Handoff* below).

## Implementation Steps

1. **Draft this plan file + branch.** First commit on `feat/runtime-0.3.0-id-lookup-retry-skip-llm` is the plan itself; open PR ready-for-review on the plan commit, then convert to draft as implementation commits land.
2. **Loader byId / byName split** (`packages/runtime/src/loader.ts`):
   - Extend `AgentLoader` interface to `{ byName(slug), byId(id), load(slug) }` (`load` stays as an alias for `byName`).
   - Internal cache stores entries under `(mode, key)` so a slug lookup and an id lookup of the same underlying row don't collide.
   - Supabase query for `byId` uses `.eq("id", uuid).single()`. Loader still surfaces `load`-variant errors via `AgentRuntimeError`, with `slug` set to the lookup key in both cases (the error envelope's existing field is the human handle, not a guarantee of "slug-only").
   - Extend `createFixtureSupabase` in `src/test-fixtures.ts` so the `.eq()` builder accepts `name` or `id` and `FixtureRow` carries an optional `id`.
3. **InvokeArgs `{ slug } | { id }`** (`packages/runtime/src/types.ts`, `packages/runtime/src/invoke.ts`):
   - `InvokeArgs` widens to include both `slug?: string` and `id?: string`. Documented as exactly-one-of in JSDoc.
   - `invoke()` validates that exactly one is set; throws an `AgentRuntimeError({ type: "load", slug: <whichever>, cause: ... })` otherwise. Routes the load through `loader.byId(id)` or `loader.byName(slug)`.
4. **Retry policy** (`packages/runtime/src/types.ts`, `packages/runtime/src/invoke.ts`):
   - `InvokeArgs.retry?: 'none' | 'reprompt-with-error' | 'json-repair'` added alongside `retryOnParseError?: boolean` (latter stays).
   - In `invoke()`, resolve effective retry mode at the start of the call: `retry` wins if set; otherwise map `retryOnParseError === true → 'reprompt-with-error'`, falsy → `'none'`.
   - `'reprompt-with-error'` is the existing behavior, unchanged.
   - `'json-repair'` re-prompts on parse / validate failure with: assistant turn = the raw bad content, user turn = `"That wasn't valid JSON (${err.message}). Return it corrected."` Single retry; second failure throws the original error detail with the accumulated usage.
5. **`skipLLM` hatch** (`packages/runtime/src/runtime.ts`, `packages/runtime/src/invoke.ts`, `packages/runtime/src/types.ts`):
   - `RuntimeOptions.skipLLM?: boolean | (slug: string) => InvokeResult<unknown>`.
   - At `createRuntime`, resolve the effective skipLLM mode: explicit constructor value wins; otherwise check `process.env.SKIP_LLM === '1'` (treat as `true`) when `process.env` is available.
   - When `skipLLM` is a function: `invoke` calls `skipLLM(row.name)` after loading the row, returns its result without touching the provider.
   - When `skipLLM` is `true`: `invoke` reads `row.config.skip_llm_fixture` (if present) and returns it as the output (string for unstructured, parsed object for structured); otherwise throws an `AgentRuntimeError({ type: "load", … })` directing the consumer to either register a function fixture or set `config.skip_llm_fixture` on the row.
   - Row remains loaded in either case so `InvokeResult.agent` is correct and the lookup path (`{ slug }` or `{ id }`) is honored.
6. **CHANGELOG** (`packages/runtime/CHANGELOG.md`): add 0.3.0 entry naming all three amendments + source attribution. Match the shape of the 0.2.0 entry (additive section); does not need the bugfix shape of 0.2.1–0.2.3.
7. **Version bump** in `packages/runtime/package.json`: `0.2.3` → `0.3.0`.
8. **Tests** (`packages/runtime/src/loader.test.ts`, `packages/runtime/src/invoke.test.ts`): cover every new code path; existing tests stay green.

## Acceptance Criteria

1. `pnpm --filter @dragonflowio/agent-runtime test` passes — including the new tests for byId, `{ id }`-form invoke, exactly-one-of validation, json-repair retry, and skipLLM boolean / function cases.
2. `pnpm --filter @dragonflowio/agent-runtime build` produces ESM + CJS + `.d.ts` outputs with no type errors.
3. `pnpm typecheck` (workspace) passes.
4. A consumer calling `invoke({ slug: 'foo', input: 'x' })` with no other changes against `0.3.0` behaves identically to `0.2.3` (regression check via existing tests).
5. A consumer calling `invoke({ id: '<uuid>', input: 'x' })` loads the row by id and returns an `InvokeResult` whose `agent.name` matches the row's `name` field.
6. `invoke({ slug: 'foo', id: 'uuid', input: 'x' })` throws an `AgentRuntimeError` with detail.type === 'load'. So does `invoke({ input: 'x' })`.
7. `retryOnParseError: true` against a structured-output row that fails parse once then succeeds returns the parsed output (regression check, existing test).
8. `retry: 'json-repair'` against the same shape sends the bad assistant turn back in and prompts for a correction, then returns the parsed output. Second failure throws the parse/validate variant with usage threaded.
9. `createRuntime({ skipLLM: true })` against a row whose `config.skip_llm_fixture` is set returns the fixture as the output without making a provider call; an unset fixture throws `load`.
10. `createRuntime({ skipLLM: (slug) => ({ … }) })` calls the function with the loaded row's `name` and returns its result without making a provider call.
11. `SKIP_LLM=1` in `process.env` triggers boolean mode when the constructor doesn't pass `skipLLM`.
12. `packages/runtime/package.json` reports `0.3.0`; `CHANGELOG.md` carries a `0.3.0` entry attributing each amendment.

## Plan Sequence

Standalone follow-up minor. Not part of an active plan sequence — the eight-plan agent-runtime thread completed at Plan 8 (playbook). This release exists because three candidate amendments queued for `0.3.x` are now load-bearing for `Dragonflow_Input` Plan 6 adoption (item: `{ id }`-form invoke) and to unblock Titos-Inventario's drafter shape (items: `json-repair` retry, `skipLLM`).

## Handoff to next plan

After `0.3.0` publishes (Phase 4 + tag push triggers the publish workflow with user authorization):

**Next plan path:** Open a separate small chore PR against [`dragonflowio/playbook`](https://github.com/dragonflowio/playbook) that (a) flips the contract's *Currently published* version + recommended pin to `0.3.0` / `^0.3.0`, (b) folds the three landed items out of *Candidate amendments for 0.3* into the contract body in the same shape used when the 0.2.x amendments were folded (see [playbook#37](https://github.com/dragonflowio/playbook/pull/37), [#39](https://github.com/dragonflowio/playbook/pull/39), [#40](https://github.com/dragonflowio/playbook/pull/40), [#42](https://github.com/dragonflowio/playbook/pull/42)), (c) bumps the blueprint's shape-diagram version progression to `0.3.0`, and (d) adds a CHANGELOG entry pointing at this PR. Cross-repo and a separate scope — do not bundle it into this PR.

After the playbook chore lands: hand `Dragonflow_Input` back its Plan 6 unblock — _"0.3.0 published; Dragonflow_Input Plan 6 can resume against ^0.3.0 via Appendix C in the blueprint."_
