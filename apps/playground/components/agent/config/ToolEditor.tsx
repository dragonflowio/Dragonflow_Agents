'use client'

import { Agent, ToolDefinition } from '@/lib/types/agent'
import { Button } from '@/components/ui/button'
import { ToolItem } from './ToolItem'

export function ToolEditor({
  agent,
  onChange
}: {
  agent: Agent
  onChange: (updates: Partial<Agent>) => void
}) {
  const tools = agent.config?.tools ?? []

  const updateTools = (newTools: ToolDefinition[]) => {
    onChange({
      config: {
        ...agent.config,
        tools: newTools
      }
    })
  }

  const addFunctionTool = () => {
    updateTools([
      ...tools,
      { type: 'function', name: '', description: '', parameters: {} }
    ])
  }

  const addMcpTool = () => {
    updateTools([
      ...tools,
      { type: 'mcp', server_url: '', server_label: '', allowed_tools: [], authorization: '', require_approval: 'never' }
    ])
  }

  const handleUpdate = (index: number, updatedTool: ToolDefinition) => {
    const newTools = [...tools]
    newTools[index] = updatedTool
    updateTools(newTools)
  }

  const handleRemove = (index: number) => {
    const newTools = [...tools]
    newTools.splice(index, 1)
    updateTools(newTools)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newTools = [...tools]
    const temp = newTools[index - 1]
    newTools[index - 1] = newTools[index]
    newTools[index] = temp
    updateTools(newTools)
  }

  const handleMoveDown = (index: number) => {
    if (index === tools.length - 1) return
    const newTools = [...tools]
    const temp = newTools[index + 1]
    newTools[index + 1] = newTools[index]
    newTools[index] = temp
    updateTools(newTools)
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wide">Tools</h3>
      </div>

      <div className="space-y-4">
        {tools.length === 0 ? (
          <p className="text-sm text-muted italic">No tools configured.</p>
        ) : (
          tools.map((tool, index) => (
            <ToolItem
              key={index}
              index={index}
              total={tools.length}
              tool={tool}
              onChange={(updated: ToolDefinition) => handleUpdate(index, updated)}
              onRemove={() => handleRemove(index)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          ))
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={addFunctionTool}>
          + Add Function Tool
        </Button>
        <Button variant="outline" size="sm" onClick={addMcpTool}>
          + Add MCP Tool
        </Button>
      </div>
    </div>
  )
}
