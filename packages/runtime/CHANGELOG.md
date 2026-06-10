# `@dragonflowio/agent-runtime` changelog

## 0.3.1 — 2026-06-09

**Bugfix.** The OpenAI provider sent `max_tokens` in the chat-completions request body. OpenAI's GPT-5 family (and `o1`/`o3`) **rejects** `max_tokens` with HTTP 400 (`Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.`), so every consumer whose agent rows use a GPT-5+ model could not invoke through the runtime at all. Rename the chat-completions body field from `max_tokens` to `max_completion_tokens`. Row-level `config.max_tokens` (the [agents-table convention](https://github.com/dragonflowio/playbook/blob/main/playbook/agents-table.md#standard-config-keys)) keeps its name — only the wire-level OpenAI request changes.

- `src/providers/openai.ts` — chat-completions body uses `max_completion_tokens: req.max_tokens`.
- `src/providers/openai.test.ts` — the existing Authorization-header test now also asserts `max_completion_tokens` is sent and `max_tokens` is not.

Per OpenAI's published guidance, `max_completion_tokens` is the recommended forward-going parameter and `max_tokens` is deprecated. `gpt-4o`, `gpt-4-turbo`, and the `o1`/`o3`/`gpt-5*` families all accept `max_completion_tokens`. The legacy `gpt-3.5-turbo` family only accepts `max_tokens` and is not used by any current adopter (verified across the in-thread fan-out + post-thread Input).

Surfaced by the [`Dragonflow_Input` Plan 6 PR](https://github.com/dragonflowio/Dragonflow-Input/pull/10) (post-thread Plan-6-shaped adoption). Canvas's Plan 4 pilot didn't surface it (Anthropic-only); the four Plan 6 fan-out PRs didn't either (their OpenAI rows used `gpt-4o`, not `gpt-5*`). Per the blueprint's blocking semantics, this patch ships before the Input PR re-pins to `^0.3.1`.

## 0.3.0 — 2026-06-09

Three additive amendments from the v0.1 contract's *Candidate amendments for 0.3 (still queued)* section. All non-breaking — pinned `^0.2.x` consumers keep working untouched.

- **`invoke({ id })` as an alternative to `invoke({ slug })`.** `InvokeArgs` widens to `{ slug?: string; id?: string }` with exactly-one-of validation at invoke time (both-set or neither-set throws `AgentRuntimeError({ type: "load" })`). The loader gains `byId(id)` alongside `byName(slug)`; the existing `load(slug)` is preserved as an alias for `byName` so 0.2.x callers using the loader directly don't break. Cache slots partition by lookup mode so a row fetched by id and the same row fetched by slug do not cross-contaminate. `InvokeResult.agent.name` continues to carry the row's slug regardless of lookup form. Surfaced by the [`Dragonflow_Input` Plan 1 audit](https://github.com/dragonflowio/Dragonflow_Input/blob/main/docs/agents-audit.md) — Input's call sites look up agents by UUID via `apps.default_agent_id` and never had a slug literal. **Load-bearing for Input's Plan 6 follow-up adoption.**

- **`retry?: 'none' | 'reprompt-with-error' | 'json-repair'`.** Replaces the boolean `retryOnParseError` with a string union; the boolean stays accepted at the boundary and maps `true → 'reprompt-with-error'`, `false → 'none'`. The new `'json-repair'` shape re-prompts on parse / validate failure with the bad assistant turn echoed back and a follow-up user turn (`"That wasn't valid JSON ($error). Return it corrected."`), then re-parses; second failure throws the original parse/validate variant with accumulated usage. Surfaced by the [`Titos-Inventario` Plan 1 audit](https://github.com/dragonflowio/Titos-Inventario/blob/main/docs/agents-audit.md) — the `physical-inventory-drafter` ships this exact reprompt shape inline; first-class support means future drafters don't reinvent it.

- **`createRuntime({ skipLLM?: boolean | (slug) => InvokeResult })`.** Deterministic-bypass hatch for tests, CI, and offline environments. `true` returns `row.config.skip_llm_fixture` as the output and skips the provider call entirely (unset fixture throws `load`, directing the consumer to register a function bypass or set the fixture). A function gives the consumer full control per slug, called with the loaded row's `name`. When the constructor doesn't pass `skipLLM`, the runtime picks up `process.env.SKIP_LLM === '1'` as boolean mode — matches Titos-Inventario's existing env-var hatch so adopters migrating off it don't change env-var names. Surfaced by the [`Titos-Inventario` Plan 1 audit](https://github.com/dragonflowio/Titos-Inventario/blob/main/docs/agents-audit.md) — every adopter's CI hits the same friction.

## 0.2.3 — 2026-06-09

**Peer-range widening.** `peerDependencies.zod` widens from `^3.23.0` to `^3.23.0 || ^4.0.0`. No code change. Consumers pinning zod 4 (e.g., `Proveedores-Admin` at `^4.3.6`) no longer trip `npm ls zod` "invalid" warnings. The only v3-only touchpoint is `zodToJsonSchema` in `invoke.ts`, whose output is shape-compatible across v3 and v4; `schema.safeParse()` (the structured-output path) is part of zod's stable public API on both majors.

Surfaced by [`Proveedores-Admin` Plan 6 PR #28](https://github.com/dragonflowio/Proveedores-Admin/pull/28) Plan 7 sweep one-liner; queued follow-up from [`playbook` Plan 7 PR #44](https://github.com/dragonflowio/playbook/pull/44).

## 0.2.2 — 2026-06-09

**Bugfix.** The runtime accepted `config.temperature` on agent rows (the type allowed it implicitly via the `[key: string]: unknown` index signature) but silently dropped it on the wire — every provider call used the provider's default temperature. Rows that authored a non-default temperature were effectively ignored.

- `types.ts` — `AgentRowConfig` gains an optional `temperature?: number` field. Backwards-compatible; consumers without a temperature on the row are unaffected.
- `loader.ts` — validates `config.temperature` when present (must be a finite non-negative number); rejects with the `load` error variant otherwise.
- `providers/types.ts` — `ProviderRequest` gains optional `temperature?: number`.
- `invoke.ts` — forwards `row.config.temperature` to the provider when defined; omits it otherwise (preserves prior-default behavior for rows that don't author one).
- `providers/anthropic.ts` — adds `temperature` to the Messages API body when defined.
- `providers/openai.ts` — adds `temperature` to the chat-completions body when defined.
- `providers/google.ts` — adds `temperature` to `generationConfig` alongside `maxOutputTokens` when defined.
- Tests: per-provider tests assert temperature is forwarded when set and omitted when unset; loader test covers the validate path; `invoke.test.ts` covers the row-to-provider plumbing both ways.

Surfaced by [`Proveedores-Admin` Plan 6 kickoff](https://github.com/dragonflowio/Proveedores-Admin) — every agent row in that project authors `config.temperature` (0.1–0.4); shipping Plan 6 against `0.2.1` would have silently regressed output quality across CUCOP suggestion, requirements comparison, and the newsletter narrator pipeline. Canvas did not surface this because its rows did not author non-default temperatures.

## 0.2.1 — 2026-06-09

**Bugfix.** Tool loops broke against every provider — after a tool call, the runtime echoed the assistant turn back without the `tool_use` / `tool_calls` / `functionCall` blocks, so the next `tool_result` was orphaned and providers rejected the request with HTTP 400.

- `types.ts` — assistant `ChatMessage` variant gains optional `toolCalls?: ProviderToolCall[]`. Backwards-compatible; existing no-tool consumers (Canvas Plan 4 pilot pinned at `^0.1.0`) are unaffected.
- `invoke.ts` — when pushing the assistant turn back into the conversation after a tool call, includes `response.toolCalls` so providers can reconstruct the full prior turn.
- `providers/anthropic.ts` — `toAnthropicMessages` reconstructs `content: [{type:"text",...}, {type:"tool_use",...}]` when `toolCalls` is present.
- `providers/openai.ts` — `toOpenAIMessages` emits `tool_calls: [{id, type:"function", function:{name, arguments}}]` (with JSON-stringified arguments) when `toolCalls` is present.
- `providers/google.ts` — `toGoogleContents` emits `parts: [{text}, {functionCall:{name, args}}]` when `toolCalls` is present.
- Regression tests added in `invoke.test.ts` and `providers/anthropic.test.ts` (38 tests pass, was 36). The new `invoke.test.ts` test asserts the assistant turn passed to the second loop iteration preserves `toolCalls`; the new `anthropic.test.ts` test asserts the wire-level message body reconstructs both `text` and `tool_use` blocks.

Surfaced by [`Dragonflow_Agents` Plan 5](https://github.com/dragonflowio/Dragonflow_Agents/pull/14) (playground rewire), criterion 6 (tool-stub end-to-end).

## 0.2.0 — 2026-06-09

Four post-pilot amendments from [`Dragonflow_Canvas` Plan 4](https://github.com/dragonflowio/Dragonflow_Canvas/pull/6), specified in [`playbook` 2026-06-09 CHANGELOG entry](https://github.com/dragonflowio/playbook/blob/main/CHANGELOG.md). All additive — no v0.1 surface changes.

- `InvokeResult.agent` — exposes `{ name, model, provider }` so consumers stop double-calling the loader.
- `usage` optionally present on the `provider`, `parse`, and `validate` error variants so error-path audit-log rows keep token counts.
- Docs: one-paragraph note that the `validate` error variant is opt-in by tightening, not free at swap-time.
- Docs: "one client per `createRuntime`, service-role recommended for `agents` reads" stance documented.

## 0.1.0 — 2026-06-06

Initial release. Implements the [v0.1 invocation contract](https://github.com/dragonflowio/playbook/blob/main/playbook/agent-invocation-contract.md). See `README.md` for surface and usage.
