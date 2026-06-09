'use client'

import { useMemo, useState } from 'react'

import { Agent, AgentConfig, ToolDefinition } from '@/lib/types/agent'
import type { ToolConfig } from '@/lib/playground/tool-registry'
import { InputBar } from './InputBar'
import { MessageList } from './MessageList'
import { ToolRegistryPanel } from './ToolRegistryPanel'
import { PlaygroundMessage } from './types'

type ChatResponse = {
  output: unknown
  raw: unknown
  usage: { input_tokens: number; output_tokens: number }
  agent: { name: string; model: string; provider: string }
}

type ErrorResponse = {
  type?: string
  message?: string
  error?: string
}

export function PlaygroundTab({ agent }: { agent: Agent }) {
  const tools = useMemo(() => readTools(agent.config), [agent.config])
  const hasSchema = Boolean(agent.config?.output_schema)

  const [messages, setMessages] = useState<PlaygroundMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [useSystemInstruction, setUseSystemInstruction] = useState(true)
  const [toolConfig, setToolConfig] = useState<ToolConfig>({})

  async function handleSend() {
    const text = draft.trim()
    if (!text || loading) return

    const userMessage: PlaygroundMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setDraft('')
    setLoading(true)

    try {
      const body = {
        slug: agent.name,
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
        ...(useSystemInstruction ? {} : { system: '' }),
        toolConfig,
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as ErrorResponse
        const message = err.message ?? err.error ?? `HTTP ${res.status}`
        const kind = err.type ? `[${err.type}] ` : ''
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: '',
            error: `${kind}${message}`,
          },
        ])
        return
      }

      const data = (await res.json()) as ChatResponse
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: formatOutput(data.output, hasSchema),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: '',
          error: err instanceof Error ? err.message : String(err),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex-1 min-h-0">
        <MessageList messages={messages} loading={loading} />
      </div>

      {tools.length ? (
        <ToolRegistryPanel tools={tools} value={toolConfig} onChange={setToolConfig} />
      ) : null}

      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={useSystemInstruction}
          onChange={(event) => setUseSystemInstruction(event.target.checked)}
          className="h-3.5 w-3.5"
        />
        <span>Use agent system instruction</span>
      </label>

      <InputBar
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        onStop={() => {}}
        streaming={loading}
        showOverrides={false}
        onToggleOverrides={() => {}}
        pendingAttachments={[]}
        acceptedFileTypes=""
        onSelectFiles={() => {}}
        onRemoveAttachment={() => {}}
      />
    </div>
  )
}

function readTools(config: AgentConfig | null): ToolDefinition[] {
  if (!config?.tools || !Array.isArray(config.tools)) {
    return []
  }
  return config.tools
}

function formatOutput(output: unknown, hasSchema: boolean): string {
  if (hasSchema) {
    return JSON.stringify(output, null, 2)
  }
  return typeof output === 'string' ? output : JSON.stringify(output, null, 2)
}
