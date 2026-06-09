'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Agent } from '@/lib/types/agent'
import { Button } from '@/components/ui/button'

export function RawJsonEditor({
  agent,
  onChange
}: {
  agent: Agent
  onChange: (updates: Partial<Agent>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [jsonStr, setJsonStr] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Sync internal string when agent config updates IF we don't have pending edits
  useEffect(() => {
    setJsonStr(JSON.stringify(agent.config || {}, null, 2))
    setError(null)
  }, [agent.config])

  const handleEditorChange = (value: string | undefined) => {
    const newVal = value || ''
    setJsonStr(newVal)
    try {
      const parsed = JSON.parse(newVal)
      setError(null)
      onChange({ config: parsed })
    } catch (e: any) {
      setError(e.message || 'Invalid JSON')
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wide">Raw JSON Configuration</h3>
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide JSON Editor' : 'Show JSON Editor'}
        </Button>
      </div>

      <p className="text-sm text-slate-400">
        Advanced: Edit the raw underlying JSON object directly. Changes made here will reflect in the UI elements above.
      </p>

      {expanded && (
        <div className="space-y-2 mt-4">
          <div className="h-[400px] border border-border rounded-md overflow-hidden bg-background">
            <Editor
              height="100%"
              defaultLanguage="json"
              theme="vs-dark"
              value={jsonStr}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                formatOnPaste: true,
                autoIndent: 'full',
                tabSize: 2
              }}
            />
          </div>
          {error && <div className="text-red-400 text-sm py-1 font-mono">{error}</div>}
        </div>
      )}
    </div>
  )
}
