'use client'

import Link from 'next/link'
import { Agent, getProvider, getModality } from '@/lib/types/agent'

interface AgentListItemProps {
  agent: Agent
  isActive: boolean
}

export function AgentListItem({ agent, isActive }: AgentListItemProps) {
  const provider = getProvider(agent.model)
  const modality = getModality(agent.voice_config)

  const providerColors = {
    openai: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    google: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    anthropic: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    openrouter: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  const modalityIcons = {
    text: '💬',
    voice: '🎙️',
    realtime: '⚡',
  }

  return (
    <Link
      href={`/agents/${agent.id}`}
      className={`block p-3 border-l-2 transition-all hover:bg-surface/50 ${
        isActive
          ? 'border-accent bg-surface/50'
          : 'border-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-foreground truncate pl-1">{agent.name}</span>
        <span title={modality} className="text-xs">{modalityIcons[modality]}</span>
      </div>
      <div className="flex items-center gap-2 pl-1">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border ${providerColors[provider]}`}>
          {provider}
        </span>
      </div>
    </Link>
  )
}
