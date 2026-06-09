'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Agent, AgentProvider, AgentModality, getProvider, getModality } from '@/lib/types/agent'
import { AgentFilter } from '@/components/sidebar/AgentFilter'
import { Badge } from '@/components/ui/badge'

export function ProjectAgentTable({ agents }: { agents: Agent[] }) {
  const [providerFilter, setProviderFilter] = useState<AgentProvider | 'all'>('all')
  const [modalityFilter, setModalityFilter] = useState<AgentModality | 'all'>('all')

  const filtered = agents.filter(agent => {
    if (providerFilter !== 'all' && getProvider(agent.model) !== providerFilter) return false
    if (modalityFilter !== 'all' && getModality(agent.voice_config) !== modalityFilter) return false
    return true
  })

  return (
    <div>
      <AgentFilter
        providerFilter={providerFilter}
        modalityFilter={modalityFilter}
        onProviderChange={setProviderFilter}
        onModalityChange={setModalityFilter}
      />
      <div className="p-6">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">
            {agents.length === 0
              ? 'No agents in this project yet. Create one to get started.'
              : 'No agents match the current filters.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Model</th>
                <th className="pb-3 font-medium">Provider</th>
                <th className="pb-3 font-medium">Modality</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(agent => (
                <tr key={agent.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="text-white hover:text-accent transition-colors font-medium"
                    >
                      {agent.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-muted">{agent.model || '—'}</td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline" className="capitalize">{getProvider(agent.model)}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant="outline" className="capitalize">{getModality(agent.voice_config)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
