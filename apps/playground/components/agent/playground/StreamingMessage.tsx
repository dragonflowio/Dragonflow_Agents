'use client'

import { ToolCall } from '@/lib/chat-types'
import { ToolCallDisplay } from './ToolCallDisplay'

export function StreamingMessage({ content, toolCalls }: { content: string; toolCalls: ToolCall[] }) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%] rounded-2xl border border-border bg-surface/80 px-4 py-3 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          <span>Assistant</span>
          <span className="text-accent">Streaming</span>
        </div>

        <div className="whitespace-pre-wrap break-words text-sm leading-6">
          {content || ' '}
          <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-accent align-middle" />
        </div>

        {toolCalls.length ? (
          <div className="mt-3 space-y-2">
            {toolCalls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
