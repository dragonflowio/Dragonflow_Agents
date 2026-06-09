'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function SaveBar({
  isDirty,
  isSaving,
  onSave,
  onDiscard
}: {
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    if (isDirty) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  if (!isDirty) return null

  return (
    <div className="fixed bottom-0 left-[260px] right-0 h-16 bg-surface/95 backdrop-blur-sm border-t border-border flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span className="text-sm font-medium text-slate-200">Unsaved changes</span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onDiscard} disabled={isSaving}>
          Discard
        </Button>
        <Button variant="default" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  )
}
