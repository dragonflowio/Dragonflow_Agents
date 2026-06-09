'use client'

import { useEffect, useRef } from 'react'
import { ToolCall } from '@/lib/chat-types'
import { MessageBubble } from './MessageBubble'
import { StreamingMessage } from './StreamingMessage'
import { PlaygroundMessage } from './types'

export function MessageList({
  messages,
  streamBuffer,
  toolCalls,
  streaming,
}: {
  messages: PlaygroundMessage[]
  streamBuffer: string
  toolCalls: ToolCall[]
  streaming: boolean
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, streamBuffer, toolCalls, streaming])

  if (!messages.length && !streaming) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/80 bg-surface/30 px-6 text-center">
        <div className="max-w-md space-y-3">
          <h3 className="text-lg font-semibold">Start a test run</h3>
          <p className="text-sm leading-6 text-muted">
            Send a prompt to inspect how this agent responds with its current model, instruction, and per-run overrides.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto pr-1">
      <div className="space-y-4 pb-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {streaming ? <StreamingMessage content={streamBuffer} toolCalls={toolCalls} /> : null}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
