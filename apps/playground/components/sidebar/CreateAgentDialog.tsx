'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Project } from '@/lib/types/project'

interface CreateAgentDialogProps {
  defaultProjectId?: string
}

export function CreateAgentDialog({ defaultProjectId }: CreateAgentDialogProps = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProjects(data) })
      .catch(console.error)
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setIsCreating(true)

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          model: 'gpt-4o',
          project_id: projectId || null,
          config: { temperature: 1, max_tokens: 4096, tools: [] }
        })
      })

      if (!res.ok) throw new Error('Failed to create agent')
      
      const newAgent = await res.json()
      setOpen(false)
      setName('')
      
      // Refresh router and navigate
      router.refresh()
      router.push(`/agents/${newAgent.id}`)
      
    } catch (e) {
      console.error(e)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        defaultProjectId ? (
          <Button size="sm">New Agent</Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-6 w-6 text-muted hover:text-white" />
        )
      }>
        {defaultProjectId ? 'New Agent' : <Plus size={16} />}
      </DialogTrigger>
      <DialogContent className="bg-surface border-border">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Bootstrap a new AI agent. You can configure it fully once created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Assistant"
            />
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={(val) => setProjectId(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project">
                  {projectId && projects.length > 0
                    ? (projects.find(p => p.id === projectId)?.name ?? undefined)
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? 'Creating...' : 'Create Agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
