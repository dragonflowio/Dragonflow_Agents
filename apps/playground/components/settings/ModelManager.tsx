'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Model } from '@/lib/types/model'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

const PROVIDERS = ['openai', 'anthropic', 'google', 'openrouter']

export function ModelManager() {
  const [models, setModels] = useState<Model[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Model | null>(null)
  const [form, setForm] = useState({ provider: 'openai', model_id: '', label: '', sort_order: 0 })
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/models')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setModels(d)
      })
      .catch(console.error)
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ provider: 'openai', model_id: '', label: '', sort_order: models.length * 10 })
    setDialogOpen(true)
  }

  const openEdit = (m: Model) => {
    setEditing(m)
    setForm({ provider: m.provider, model_id: m.model_id, label: m.label, sort_order: m.sort_order })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.model_id.trim() || !form.label.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/models/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: form.label.trim(), sort_order: form.sort_order }),
        })
      } else {
        await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (m: Model) => {
    await fetch(`/api/models/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !m.is_active }),
    })
    load()
  }

  const handleDelete = async (m: Model) => {
    if (!window.confirm(`Delete model "${m.label}"?`)) return
    await fetch(`/api/models/${m.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="bg-surface border border-border rounded-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold">Models</h2>
          <p className="text-xs text-muted mt-0.5">Global — applies across all connections</p>
        </div>
        <Button size="sm" onClick={openCreate}>Add Model</Button>
      </div>

      {PROVIDERS.map(provider => {
        const group = models.filter(m => m.provider === provider)
        if (group.length === 0) return null

        return (
          <div key={provider} className="border-b border-border last:border-0">
            <div className="px-6 py-2 bg-surface/50">
              <span className="text-xs font-medium text-muted uppercase tracking-wide">{provider}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {group.map(m => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-medium text-white">{m.label}</div>
                      <div className="text-xs text-muted">{m.model_id}</div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant="outline" className={m.is_active ? 'border-accent/40 text-accent' : ''}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Switch checked={m.is_active} onCheckedChange={() => toggleActive(m)} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted hover:text-white" onClick={() => openEdit(m)}>
                          <Pencil size={14} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted hover:text-destructive" onClick={() => handleDelete(m)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Model' : 'Add Model'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {!editing && (
              <>
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="openai" />
                </div>
                <div className="space-y-2">
                  <Label>Model ID</Label>
                  <Input value={form.model_id} onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))} placeholder="e.g. gpt-4o" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Display Label</Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. GPT-4o" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.model_id.trim() || !form.label.trim()}>
                {saving ? 'Saving...' : editing ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
