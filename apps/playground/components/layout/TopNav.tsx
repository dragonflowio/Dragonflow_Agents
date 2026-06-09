'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ConnectionPublic } from '@/lib/types/connection'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function TopNav({ initialActiveId = 'home' }: { initialActiveId?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [connections, setConnections] = useState<ConnectionPublic[]>([])
  const [activeId, setActiveId] = useState<string>(initialActiveId)

  useEffect(() => {
    fetch('/api/connections')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setConnections(d)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    setActiveId(initialActiveId)
  }, [initialActiveId])

  const handleSwitch = async (id: string) => {
    if (id === activeId) {
      return
    }

    const previousId = activeId
    setActiveId(id)
    const res = await fetch('/api/connections/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      console.error(data?.error ?? 'Failed to activate connection')
      setActiveId(previousId)
      return
    }

    window.dispatchEvent(new CustomEvent('active-connection-change', {
      detail: { id },
    }))

    const nextPath = getSafeRedirectPath(pathname)
    router.replace(nextPath)
    router.refresh()
  }

  const activeLabel = activeId === 'home'
    ? 'Home'
    : (connections.find(c => c.id === activeId)?.name ?? 'Home')

  return (
    <div className="h-[57px] border-b border-border bg-surface/30 flex items-center px-6 gap-4 shrink-0">
      <span className="text-xs text-muted uppercase tracking-wider font-medium">Connection</span>
      <Select
        value={activeId}
        onValueChange={(id) => {
          if (id) void handleSwitch(id)
        }}
      >
        <SelectTrigger className="w-48 h-8">
          <SelectValue>
            {activeLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="home">Home</SelectItem>
          {connections.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function getSafeRedirectPath(pathname: string | null) {
  if (!pathname) {
    return '/'
  }

  if (pathname === '/settings') {
    return '/settings'
  }

  return '/'
}
