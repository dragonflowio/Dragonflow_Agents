'use client'

import { useState } from 'react'
import { Agent } from '@/lib/types/agent'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function SlackChannelEditor({
  agent,
  onChange
}: {
  agent: Agent
  onChange: (updates: Partial<Agent>) => void
}) {
  const [newChannel, setNewChannel] = useState('')
  
  const hasSlack = !!(agent.config && 'slack_target_channels' in agent.config)
  const channels = agent.config?.slack_target_channels || []

  const toggleSlack = (enabled: boolean) => {
    if (enabled) {
      onChange({ config: { ...agent.config, slack_target_channels: [] } })
    } else {
      const { slack_target_channels, ...rest } = agent.config || {}
      onChange({ config: Object.keys(rest).length ? rest : undefined })
    }
  }

  const handleAddChannel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = newChannel.trim().replace(/^#/, '')
      if (trimmed && !channels.includes(`#${trimmed}`)) {
        onChange({ config: { ...agent.config, slack_target_channels: [...channels, `#${trimmed}`] } })
        setNewChannel('')
      }
    }
  }

  const handleRemoveChannel = (ch: string) => {
    onChange({
      config: {
        ...agent.config,
        slack_target_channels: channels.filter(c => c !== ch)
      }
    })
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wide">Slack Channels</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="slack-toggle" className="text-sm font-normal text-slate-300">Enable Slack Target</Label>
          <Switch
            id="slack-toggle"
            checked={hasSlack}
            onCheckedChange={toggleSlack}
          />
        </div>
      </div>

      {hasSlack && (
        <div className="bg-background border border-border text-sm p-3 flex flex-wrap gap-2 items-center rounded-md min-h-[48px]">
          {channels.length === 0 && newChannel === '' && (
            <span className="text-muted italic px-2">No Slack channels configured.</span>
          )}
          {channels.map((ch, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1 py-1 px-2 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
              {ch}
              <button
                onClick={() => handleRemoveChannel(ch)}
                className="text-muted hover:text-white rounded-full ml-1"
              >
                ×
              </button>
            </Badge>
          ))}
          <input
            type="text"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            onKeyDown={handleAddChannel}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted min-w-[150px] ml-2"
            placeholder="Type channel and press Enter..."
          />
        </div>
      )}
    </div>
  )
}
