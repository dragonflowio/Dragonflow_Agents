'use client'

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef } from 'react'
import { Paperclip, Settings2, Send, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PlaygroundAttachment } from './types'

export function InputBar({
  draft,
  onDraftChange,
  onSend,
  onStop,
  streaming,
  disabled,
  showOverrides,
  onToggleOverrides,
  pendingAttachments,
  attachmentError,
  acceptedFileTypes,
  onSelectFiles,
  onRemoveAttachment,
}: {
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  streaming: boolean
  disabled?: boolean
  showOverrides: boolean
  onToggleOverrides: () => void
  pendingAttachments: PlaygroundAttachment[]
  attachmentError?: string | null
  acceptedFileTypes: string
  onSelectFiles: (files: FileList | null) => void
  onRemoveAttachment: (index: number) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const canSend = Boolean(draft.trim() || pendingAttachments.length)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [draft])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!streaming && !disabled && canSend) {
      onSend()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!streaming && !disabled && canSend) {
        onSend()
      }
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSelectFiles(event.target.files)
    event.target.value = ''
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onToggleOverrides}
          className="inline-flex items-center gap-2 rounded-lg border border-border/80 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-background/70 hover:text-foreground"
        >
          <Settings2 size={14} />
          {showOverrides ? 'Hide overrides' : 'Show overrides'}
        </button>

        <div className="text-xs text-muted">
          {streaming ? 'Streaming response...' : 'Enter to send, Shift+Enter for newline'}
        </div>
      </div>

      {attachmentError ? (
        <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {attachmentError}
        </div>
      ) : null}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'This agent cannot run in the text playground yet.' : 'Ask the agent something...'}
            disabled={disabled || streaming}
            className="max-h-40 min-h-24 resize-none bg-background/70"
            rows={1}
          />

          {pendingAttachments.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {pendingAttachments.map((attachment, index) => (
                <div
                  key={`${attachment.filename}-${index}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs text-muted"
                >
                  <span className="truncate font-medium text-foreground" title={attachment.filename}>
                    {attachment.filename}
                  </span>
                  <span>{formatFileSize(attachment.file?.size ?? 0)}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(index)}
                    className="rounded-full text-muted transition-colors hover:text-foreground"
                    aria-label={`Remove ${attachment.filename}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes}
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || streaming}
          className="mb-1"
        >
          <Paperclip size={14} />
          Attach
        </Button>

        {streaming ? (
          <Button type="button" variant="destructive" onClick={onStop} className="mb-1">
            <Square size={14} />
            Stop
          </Button>
        ) : (
          <Button type="submit" disabled={disabled || !canSend} className="mb-1">
            <Send size={14} />
            Send
          </Button>
        )}
      </div>
    </form>
  )
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${size} B`
}
