'use client'

import { AgentProvider, AgentModality } from '@/lib/types/agent'

interface AgentFilterProps {
  providerFilter: AgentProvider | 'all'
  modalityFilter: AgentModality | 'all'
  onProviderChange: (provider: AgentProvider | 'all') => void
  onModalityChange: (modality: AgentModality | 'all') => void
}

export function AgentFilter({ providerFilter, modalityFilter, onProviderChange, onModalityChange }: AgentFilterProps) {
  const providers: { label: string; value: AgentProvider | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'OpenAI', value: 'openai' },
    { label: 'Google', value: 'google' },
    { label: 'Anthropic', value: 'anthropic' },
    { label: 'OpenRouter', value: 'openrouter' },
  ]

  const modalities: { label: string; value: AgentModality | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Text', value: 'text' },
    { label: 'Voice', value: 'voice' },
    { label: 'Realtime', value: 'realtime' },
  ]

  return (
    <div className="p-4 border-b border-border space-y-4 text-sm">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Provider</label>
        <div className="flex flex-wrap gap-2">
          {providers.map((p) => (
            <button
              key={p.value}
              onClick={() => onProviderChange(p.value)}
              className={`px-2 py-1 rounded-full border transition-colors ${
                providerFilter === p.value
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-transparent text-muted hover:border-accent hover:text-foreground border-border'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted uppercase tracking-wider">Modality</label>
        <div className="flex flex-wrap gap-2">
          {modalities.map((m) => (
            <button
              key={m.value}
              onClick={() => onModalityChange(m.value)}
              className={`px-2 py-1 rounded-full border transition-colors ${
                modalityFilter === m.value
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-transparent text-muted hover:border-accent hover:text-foreground border-border'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
