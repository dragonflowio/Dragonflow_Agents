'use client'

import { Agent } from '@/lib/types/agent'

export function PlaygroundTab(_props: { agent: Agent }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md rounded-lg border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Chat is being wired onto <code>@dragonflowio/agent-runtime</code>.</p>
        <p>
          The playground chat surface temporarily renders this placeholder while blueprint{' '}
          <a
            href="https://github.com/dragonflowio/playbook/blob/main/docs/agent-runtime-blueprint-2026-06-06.md#plan-5--playground-rewired-onto-dragonflowioagent-runtime"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Plan 5 (<code>feat/plan-5-playground-rewire</code>)
          </a>{' '}
          replaces the bespoke chat orchestration with the shared runtime. The supporting{' '}
          <code>MessageList</code>, <code>StreamingMessage</code>, <code>ToolCallDisplay</code>, and{' '}
          <code>OverridePanel</code> components on this branch are kept for Plan 5 to reuse.
        </p>
      </div>
    </div>
  )
}
