'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export function NextAgentField({ nextAgentId }: { nextAgentId: string }) {
  const [agentName, setAgentName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${nextAgentId}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        if (active) {
          setAgentName(data.name)
        }
      } catch {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAgent()
    return () => { active = false }
  }, [nextAgentId])

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wide">Chains To</h3>
      
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="h-6 w-48 bg-border/50 animate-pulse rounded-md" />
        ) : error || !agentName ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{nextAgentId}</span>
            <Badge variant="destructive" className="uppercase text-[10px]">Not Found</Badge>
          </div>
        ) : (
          <Link href={`/agents/${nextAgentId}`} className="text-accent hover:underline font-medium">
            → {agentName}
          </Link>
        )}
      </div>
    </div>
  )
}
