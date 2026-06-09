'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Agent, getProvider, getModality } from '@/lib/types/agent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function AgentHeader({ agent }: { agent: Agent }) {
  const provider = getProvider(agent.model)
  const modality = getModality(agent.voice_config)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
      setIsDeleting(true)
      try {
        const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' })
        if (res.ok) {
          router.push('/')
          router.refresh()
        } else {
          console.error('Delete failed')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="px-6 py-4 border-b border-border bg-surface/30 flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{agent.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>{agent.model || 'No model specified'}</span>
          <span className="text-border">•</span>
          <Badge variant="outline" className="capitalize">{provider}</Badge>
          <Badge variant="outline" className="capitalize">{modality}</Badge>
        </div>
      </div>
      <Button 
        variant="destructive" 
        size="icon" 
        onClick={handleDelete} 
        disabled={isDeleting}
        className="opacity-80 hover:opacity-100"
        title="Delete Agent"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  )
}
