# Pre-plan: Deferred Features (Post-v1)

**Date:** 2026-06-08
**Status:** Pre-plan (backlog). Not promoted to a plan; not assigned to a sequence.

## Provenance

These were the explicit *post-v1* deferrals at the end of the original phase 1–4 effort that produced the agent-playground codebase (the work now parked on [`wip/2026-06-01-pre-adoption`](https://github.com/dragonflowio/Dragonflow_Agents/tree/wip/2026-06-01-pre-adoption)). The planning was captured in `docs/agent-playground/future-tasks.md` inside `Dragonflow_Core` while this app still lived as `Dragonflow_Core/apps/agent-playground/`. That folder was left untracked when the app moved to its own repo, and the rest of those plan docs were retired in 2026-06-08 alongside the playbook adoption. This file preserves the deferred-feature list — the only piece of the legacy docs with forward value — so it can be triaged into real plans alongside the `wip/2026-06-01-pre-adoption` work.

Treat each item as a candidate pre-plan, not as an accepted plan. None has a sequence position yet. The descriptions are the original v1-era write-up; constraints and provider behavior may have shifted since.

---

## 1. Voice session recording & playback

**What it is.** The v1 Voice tab is live-only — audio is streamed in real time but never saved. This feature would record each voice session (or individual turns) and allow playback from within the History tab.

**Why it matters.** Currently, reviewing how an agent responded to a specific voice input requires re-running the session. Recording enables async review, quality comparison across config changes, and debugging of edge cases.

**Scope when ready.**
- Server-side: capture audio chunks as they arrive in the WebSocket proxy; write to Supabase Storage or a temp file, then persist the path to DB.
- Client-side: playback UI in the History tab with a waveform scrubber.
- Consider GDPR/privacy: recordings may need a retention policy.

---

## 2. Agentic agent creation

**What it is.** An LLM-powered mode where the user describes what they want an agent to do in natural language ("I want an agent that analyzes sales data and responds in Spanish with bullet points"), and the app drafts a complete agent configuration — system instruction, model selection, tool definitions, and output schema — which the user can review and save.

**Why it matters.** Config editing requires familiarity with the schema. An agentic mode lowers the bar for creating new agents from scratch and speeds up iteration for experienced users.

**Scope when ready.**
- A "Create with AI" button in the sidebar that opens a chat interface.
- A meta-prompt that understands the agent schema and available tools/providers.
- Output: a pre-filled config editor that the user reviews before saving.
- Optionally: refine by iterating ("make it more concise", "add a tool to query Supabase").

---

## 3. `prompt_id` fetch from OpenAI prompt store

**What it is.** Some agents store a `prompt_id` (e.g. `pmpt_698fab57...`) that references a system instruction managed externally in OpenAI's prompt store rather than inline in the `system_instruction` column. In v1, this ID is displayed as a read-only badge — the playground does not fetch the actual text.

**Why it matters.** When testing an agent that uses `prompt_id`, the user currently has to manually locate and paste the prompt text into `system_instruction`. Fetching it automatically would close that gap and allow the playground to show the live prompt used in production.

**Scope when ready.**
- Add OpenAI API call to `GET /v1/prompts/:prompt_id` on page load if `prompt_id` is set.
- Display the resolved system instruction as read-only in the Config tab (with a note that edits require going to the prompt store).
- Option to "fork" the prompt: copy it into `system_instruction` and clear `prompt_id` for local testing.

---

## 4. Prompt versioning / config history

**What it is.** Currently, saving a config overwrites the previous value with no history. This feature would track a changelog of all config changes per agent.

**Scope when ready.**
- A `agent_config_history` table in Supabase with columns: `agent_id`, `changed_at`, `changed_by`, `previous_config`, `new_config`.
- Insert a row on every PUT to `/api/agents/[id]`.
- History tab UI: timeline of changes, diff view between versions, restore button.

---

## 5. Large file uploads (100 MB+)

**What it is.** Phase 4 introduces file attachments capped at 20 MB, transported as base64 through the Next.js API route. This works for typical images and PDFs but doubles the payload size. For files exceeding ~100 MB (large datasets, audio recordings, high-res scans), the current approach is impractical.

**Why it matters.** Some agents may need to process large documents or media. Base64 through the API route would timeout or hit memory limits at that scale.

**Scope when ready.**
- Client-side: generate a signed upload URL (e.g. Supabase Storage or S3 presigned URL), upload directly from the browser.
- Server-side: API route receives the storage path/URL instead of raw bytes, downloads from storage when forwarding to the LLM provider.
- Streaming upload progress bar in the InputBar attachment chips.
- Consider cleanup: auto-delete uploaded files after the session ends or after a TTL.

---

## 6. Agent chaining execution

**What it is.** Some agents have a `next_agent_id` field that chains them together. In v1, the UI displays the linked agent name but does not execute chains in the playground.

**Scope when ready.**
- Playground sends the output of agent A as the input to agent B automatically.
- UI shows a multi-step trace: which agent handled which turn.
- Config: configurable handoff conditions (e.g., "when output contains X, chain to next agent").

---

## Triage notes

- Items 3, 4, and 6 depend on shape decisions in the `wip/2026-06-01-pre-adoption` triage — they touch the config editor, the API routes, and the agent schema, all of which may evolve before any of these become a plan.
- Item 2 ("agentic agent creation") is the first item that introduces an LLM call site to the app itself; see the *Intentionally unfinished* row in [STATUS.md](../STATUS.md) about the agents-table requirement when the first LLM lands.
- Item 1 (voice recording) is only meaningful once the Voice tab itself ships from the WIP triage.
