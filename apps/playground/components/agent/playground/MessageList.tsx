'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { PlaygroundMessage } from './types'

export function MessageList({
  messages,
  loading,
}: {
  messages: PlaygroundMessage[]
  loading: boolean
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, loading])

  if (!messages.length && !loading) {
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

        {loading ? (
          <div className="flex w-full justify-start">
            <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3 text-sm text-muted shadow-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                Waiting for the agent…
              </span>
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
