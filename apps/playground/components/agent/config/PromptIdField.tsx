'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PromptIdField({ promptId }: { promptId: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(promptId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wide">External Prompt ID</h3>
      
      <div className="flex items-center gap-4">
        <code className="bg-background text-accent border border-border px-3 py-1.5 rounded-md text-sm font-mono flex-1 break-all">
          {promptId}
        </code>
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      
      <p className="text-sm text-muted">
        This agent uses an external prompt managed in OpenAI's prompt store. The system instruction is not fetched here. To test this agent, paste the prompt text manually into the System Instruction field above.
        <br />
        <a href="#" className="text-accent hover:underline mt-1 inline-block">Learn more in future-tasks.md</a>
      </p>
    </div>
  )
}
