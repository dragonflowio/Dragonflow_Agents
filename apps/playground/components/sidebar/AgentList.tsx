'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Agent, getProvider, getModality, AgentProvider, AgentModality } from '@/lib/types/agent'
import { AgentFilter } from './AgentFilter'
import { AgentListItem } from './AgentListItem'
import { ScrollArea } from '../ui/scroll-area'
import { CreateAgentDialog } from './CreateAgentDialog'

export function AgentList() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [providerFilter, setProviderFilter] = useState<AgentProvider | 'all'>('all')
  const [modalityFilter, setModalityFilter] = useState<AgentModality | 'all'>('all')
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAgents(data)
      })
      .catch(console.error)
  }, [])

  const filteredAgents = agents.filter(agent => {
    const p = getProvider(agent.model)
    const m = getModality(agent.voice_config)
    if (providerFilter !== 'all' && p !== providerFilter) return false
    if (modalityFilter !== 'all' && m !== modalityFilter) return false
    return true
  })

  return (
    <div className="flex flex-col h-full bg-surface/30">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <h2 className="font-semibold text-lg">Agents</h2>
        <CreateAgentDialog />
      </div>
      
      <AgentFilter
        providerFilter={providerFilter}
        modalityFilter={modalityFilter}
        onProviderChange={setProviderFilter}
        onModalityChange={setModalityFilter}
      />

      <ScrollArea className="flex-1">
        <div className="py-2">
          {filteredAgents.map(agent => (
            <AgentListItem
              key={agent.id}
              agent={agent}
              isActive={pathname === `/agents/${agent.id}`}
            />
          ))}
          {filteredAgents.length === 0 && (
            <div className="p-4 text-center text-sm text-muted">No agents match filters</div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
