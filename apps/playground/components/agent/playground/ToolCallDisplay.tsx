'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ToolCall } from '@/lib/chat-types'

export function ToolCallDisplay({ toolCall, className }: { toolCall: ToolCall; className?: string }) {
  return (
    <details className={cn('rounded-lg border border-border/80 bg-background/70', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            tool call
          </Badge>
          <span className="font-medium">{toolCall.name}</span>
        </div>
        <span className="text-xs text-muted">Inspect arguments</span>
      </summary>
      <div className="border-t border-border/60 px-3 py-3">
        <pre className="overflow-x-auto text-xs text-muted whitespace-pre-wrap break-words">
          {JSON.stringify(toolCall.arguments, null, 2)}
        </pre>
      </div>
    </details>
  )
}
