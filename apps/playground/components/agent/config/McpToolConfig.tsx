'use client'

import { useState } from 'react'
import { ToolDefinition } from '@/lib/types/agent'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

export function McpToolConfig({
  tool,
  onChange
}: {
  tool: ToolDefinition
  onChange: (updated: ToolDefinition) => void
}) {
  const [newTag, setNewTag] = useState('')

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = newTag.trim()
      if (trimmed) {
        const current = tool.allowed_tools || []
        if (!current.includes(trimmed)) {
          onChange({ ...tool, allowed_tools: [...current, trimmed] })
        }
        setNewTag('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const current = tool.allowed_tools || []
    onChange({ ...tool, allowed_tools: current.filter(t => t !== tagToRemove) })
  }

  const isPlaceholder = tool.authorization?.startsWith('$')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Server Label</Label>
          <Input
            value={tool.server_label || ''}
            onChange={(e) => onChange({ ...tool, server_label: e.target.value })}
            placeholder="e.g. Supabase Server"
          />
        </div>
        <div className="space-y-2">
          <Label>Server URL</Label>
          <Input
            value={tool.server_url || ''}
            onChange={(e) => onChange({ ...tool, server_url: e.target.value })}
            placeholder="http://localhost:8000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Allowed Tools</Label>
        <div className="border border-border rounded-md p-2 flex flex-wrap gap-2 items-center bg-background min-h-[42px]">
          {(tool.allowed_tools || []).map((tag, i) => (
            <Badge key={i} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-muted-foreground hover:text-white rounded-full focus:outline-none"
              >
                ×
              </button>
            </Badge>
          ))}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted min-w-[120px]"
            placeholder="Type and press Enter..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Authorization</Label>
            {isPlaceholder && (
              <Tooltip>
                <TooltipTrigger render={<span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-xs cursor-help" />}>
                  i
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>This is an environment variable placeholder. It is resolved server-side at call time and never exposed to the browser.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Input
            type="password"
            value={tool.authorization || ''}
            onChange={(e) => onChange({ ...tool, authorization: e.target.value })}
            placeholder="Bearer token or $ENV_VAR"
            className={isPlaceholder ? 'font-mono text-blue-400' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label>Require Approval</Label>
          <Select
            value={(tool.require_approval as string) || 'never'}
            onValueChange={(val) => onChange({ ...tool, require_approval: val || undefined })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never</SelectItem>
              <SelectItem value="always">Always</SelectItem>
              <SelectItem value="once_per_session">Once Per Session</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
