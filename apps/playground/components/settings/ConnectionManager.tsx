'use client'

import { useEffect, useState } from 'react'
import { Pencil, Trash2, Zap } from 'lucide-react'
import { ConnectionPublic } from '@/lib/types/connection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DiscoveredProject {
  name: string
  supabase_url: string
}

export function ConnectionManager() {
  const [connections, setConnections] = useState<ConnectionPublic[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ConnectionPublic | null>(null)
  const [form, setForm] = useState({ name: '', supabase_url: '', service_role_key: '', pat: '' })
  const [pat, setPat] = useState('')
  const [discovered, setDiscovered] = useState<DiscoveredProject[]>([])
  const [discovering, setDiscovering] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/connections')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setConnections(d)
      })
      .catch(console.error)
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', supabase_url: '', service_role_key: '', pat: '' })
    setPat('')
    setDiscovered([])
    setDialogOpen(true)
  }

  const openEdit = (c: ConnectionPublic) => {
    setEditing(c)
    setForm({ name: c.name, supabase_url: c.supabase_url, service_role_key: '', pat: '' })
    setPat('')
    setDiscovered([])
    setDialogOpen(true)
  }

  const handleDiscover = async () => {
    if (!pat.trim()) return
    setDiscovering(true)
    try {
      const res = await fetch(`/api/connections/discover?pat=${encodeURIComponent(pat.trim())}`)
      const data = await res.json()
      if (Array.isArray(data)) setDiscovered(data)
    } catch (e) {
      console.error(e)
    } finally {
      setDiscovering(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim() || (!editing && (!form.supabase_url.trim() || !form.service_role_key.trim()))) return
    setSaving(true)
    try {
      if (editing) {
        await fetch(`/api/connections/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            service_role_key: form.service_role_key || undefined,
            pat: form.pat || pat || undefined,
          }),
        })
      } else {
        await fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            supabase_url: form.supabase_url.trim(),
            service_role_key: form.service_role_key.trim(),
            pat: form.pat || pat || undefined,
          }),
        })
      }
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: ConnectionPublic) => {
    if (!window.confirm(`Remove connection "${c.name}"?`)) return
    await fetch(`/api/connections/${c.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="bg-surface border border-border rounded-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold">Connections</h2>
          <p className="text-xs text-muted mt-0.5">Remote Supabase projects — credentials stored encrypted</p>
        </div>
        <Button size="sm" onClick={openCreate}>Add Connection</Button>
      </div>

      <div className="px-6 py-3 border-b border-border/50 flex items-center justify-between">
        <div>
          <span className="font-medium text-white text-sm">Home</span>
          <p className="text-xs text-muted">Local project (env vars)</p>
        </div>
        <Badge variant="outline">Home</Badge>
      </div>

      {connections.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted text-center">No remote connections yet.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {connections.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                <td className="px-6 py-3">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-xs text-muted">{c.supabase_url}</div>
                </td>
                <td className="px-6 py-3 text-xs text-muted font-mono">{c.masked_key}</td>
                <td className="px-6 py-3">
                  {c.has_pat && <Badge variant="outline" className="text-xs">PAT</Badge>}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted hover:text-white" onClick={() => openEdit(c)}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted hover:text-destructive" onClick={() => handleDelete(c)}>
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
            <DialogTitle>{editing ? 'Edit Connection' : 'Add Connection'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {!editing && (
              <div className="p-3 border border-border rounded-lg space-y-3 bg-surface/50">
                <p className="text-xs text-muted">Optional: paste a Supabase Personal Access Token to auto-discover your projects.</p>
                <div className="flex gap-2">
                  <Input
                    value={pat}
                    onChange={e => {
                      setPat(e.target.value)
                      setForm(f => ({ ...f, pat: e.target.value }))
                    }}
                    placeholder="sbp_••••••••••••••••"
                    type="password"
                    className="flex-1"
                  />
                  <Button size="sm" variant="ghost" onClick={handleDiscover} disabled={!pat.trim() || discovering}>
                    <Zap size={14} className="mr-1" />
                    {discovering ? '...' : 'Discover'}
                  </Button>
                </div>
                {discovered.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted">Select a project to pre-fill:</p>
                    {discovered.map(p => (
                      <button
                        key={p.supabase_url}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-surface transition-colors text-muted hover:text-white"
                        onClick={() => {
                          setForm(f => ({ ...f, name: p.name, supabase_url: p.supabase_url, pat }))
                          setDiscovered([])
                        }}
                      >
                        {p.name} <span className="text-xs opacity-50">{p.supabase_url}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Production" />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Supabase URL</Label>
                <Input value={form.supabase_url} onChange={e => setForm(f => ({ ...f, supabase_url: e.target.value }))} placeholder="https://xxxx.supabase.co" />
              </div>
            )}
            <div className="space-y-2">
              <Label>{editing ? 'New Service Role Key (leave blank to keep current)' : 'Service Role Key'}</Label>
              <Input value={form.service_role_key} onChange={e => setForm(f => ({ ...f, service_role_key: e.target.value }))} placeholder="eyJ..." type="password" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save' : 'Add Connection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
