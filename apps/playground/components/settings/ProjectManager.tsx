'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Project } from '@/lib/types/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

export function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProjects(data)
      })
      .catch(console.error)
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingProject(null)
    setName('')
    setDialogOpen(true)
  }

  const openEdit = (project: Project) => {
    setEditingProject(project)
    setName(project.name)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)

    try {
      if (editingProject) {
        await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        })
      } else {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        })
      }

      setDialogOpen(false)
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`Delete project "${project.name}"? Agents assigned to it will be unassigned.`)) return

    try {
      await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="font-semibold">Projects</h2>
        <Button size="sm" onClick={openCreate}>New Project</Button>
      </div>

      {projects.length === 0 ? (
        <p className="px-6 py-12 text-sm text-muted text-center">No projects yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-border">
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Created</th>
              <th className="px-6 py-3 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                <td className="px-6 py-3 font-medium text-white">{project.name}</td>
                <td className="px-6 py-3 text-muted">
                  {new Date(project.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted hover:text-white"
                      onClick={() => openEdit(project)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted hover:text-destructive"
                      onClick={() => handleDelete(project)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Rename Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? 'Saving...' : editingProject ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
