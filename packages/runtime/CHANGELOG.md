# `@dragonflowio/agent-runtime` changelog

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
