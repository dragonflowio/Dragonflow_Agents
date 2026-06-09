'use client'

import { useState } from 'react'
import { ToolDefinition } from '@/lib/types/agent'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { McpToolConfig } from './McpToolConfig'

export function ToolItem({
  tool,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown
}: {
  tool: ToolDefinition
  index: number
  total: number
  onChange: (updated: ToolDefinition) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [paramsStr, setParamsStr] = useState(JSON.stringify(tool.parameters || {}, null, 2))
  const [paramsInvalid, setParamsInvalid] = useState(false)

  const handleParamsChange = (val: string) => {
    setParamsStr(val)
    try {
      const parsed = JSON.parse(val)
      setParamsInvalid(false)
      onChange({ ...tool, parameters: parsed })
    } catch {
      setParamsInvalid(true)
    }
  }

  const title = tool.type === 'mcp' ? tool.server_label || tool.server_url || 'New MCP Tool' : tool.name || 'New Function Tool'

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-surface border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 mr-2">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="text-muted hover:text-white disabled:opacity-30"
              title="Move Up"
            >
              ▲
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="text-muted hover:text-white disabled:opacity-30"
              title="Move Down"
            >
              ▼
            </button>
          </div>
          <Badge variant={tool.type === 'mcp' ? 'secondary' : 'default'} className="uppercase text-xs w-16 justify-center">
            {tool.type}
          </Badge>
          <span className="font-medium text-sm text-slate-200">{title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-muted hover:text-white">
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button variant="destructive" size="sm" onClick={onRemove} className="opacity-80 hover:opacity-100">
            Remove
          </Button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {tool.type === 'function' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={tool.name || ''}
                    onChange={(e) => onChange({ ...tool, name: e.target.value })}
                    placeholder="e.g. get_weather"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={tool.description || ''}
                    onChange={(e) => onChange({ ...tool, description: e.target.value })}
                    placeholder="Brief description of when to use this tool"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Parameters (JSON Schema)</Label>
                  {paramsInvalid && <span className="text-xs text-red-400">Invalid JSON</span>}
                </div>
                <Textarea
                  value={paramsStr}
                  onChange={(e) => handleParamsChange(e.target.value)}
                  className={`font-mono text-sm min-h-[120px] ${paramsInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
              </div>
            </>
          ) : (
            <McpToolConfig tool={tool} onChange={onChange} />
          )}
        </div>
      )}
    </div>
  )
}
