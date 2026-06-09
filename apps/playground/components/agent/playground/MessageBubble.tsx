'use client'

import Image from 'next/image'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ToolCallDisplay } from './ToolCallDisplay'
import { PlaygroundAttachment, PlaygroundMessage } from './types'

export function MessageBubble({ message }: { message: PlaygroundMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm',
          isUser
            ? 'border-accent/40 bg-accent/14 text-foreground'
            : 'border-border bg-surface/80 text-foreground'
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          <span>{isUser ? 'User' : 'Assistant'}</span>
          {message.error ? <span className="text-destructive">Error</span> : null}
        </div>

        {isUser && message.attachments?.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {message.attachments.map((attachment, index) => (
              <AttachmentPreview
                key={`${attachment.filename}-${index}`}
                attachment={attachment}
              />
            ))}
          </div>
        ) : null}

        {message.content ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</div>
        ) : null}

        {message.toolCalls?.length ? (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        ) : null}

        {message.error ? (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message.error}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AttachmentPreview({ attachment }: { attachment: PlaygroundAttachment }) {
  if (attachment.previewUrl) {
    return (
      <div
        className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-2 py-2"
        title={attachment.filename}
      >
        <div className="overflow-hidden rounded-lg border border-border/70">
          <Image
            src={attachment.previewUrl}
            alt={attachment.filename}
            width={48}
            height={48}
            unoptimized
            className="h-12 w-12 object-cover"
          />
        </div>
        <span className="max-w-44 truncate text-xs text-muted">{attachment.filename}</span>
      </div>
    )
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-muted"
      title={attachment.filename}
    >
      <FileText size={16} className="text-foreground" />
      <span className="max-w-44 truncate">{attachment.filename}</span>
    </div>
  )
}
