'use client'

import { Agent } from '@/lib/types/agent'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function FteEditor({
  agent,
  onChange
}: {
  agent: Agent
  onChange: (updates: Partial<Agent>) => void
}) {
  const currentMode = agent.config?.fte?.mode || 'llm_init'
  const staticMessage = agent.config?.fte?.static_message || ''

  const handleModeChange = (mode: 'llm_init' | 'static') => {
    onChange({
      config: {
        ...agent.config,
        fte: {
          ...agent.config?.fte,
          mode,
          ...(mode === 'static' ? { static_message: staticMessage } : {})
        }
      }
    })
  }

  const handleMessageChange = (val: string) => {
    onChange({
      config: {
        ...agent.config,
        fte: {
          ...agent.config?.fte,
          mode: 'static',
          static_message: val
        }
      }
    })
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wide">First Turn Experience</h3>

      <div className="space-y-4">
        <div className="flex gap-4">
          <Button
            variant={currentMode === 'llm_init' ? 'default' : 'outline'}
            onClick={() => handleModeChange('llm_init')}
          >
            AI generates opening message
          </Button>
          <Button
            variant={currentMode === 'static' ? 'default' : 'outline'}
            onClick={() => handleModeChange('static')}
          >
            Use a fixed message
          </Button>
        </div>

        {currentMode === 'static' ? (
          <div className="space-y-2">
            <Label>Static Message</Label>
            <Textarea
              value={staticMessage}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder="e.g. Hello! How can I help you today?"
              rows={3}
            />
          </div>
        ) : (
          <p className="text-sm text-muted italic">The agent will generate its own opening message.</p>
        )}
      </div>
    </div>
  )
}
