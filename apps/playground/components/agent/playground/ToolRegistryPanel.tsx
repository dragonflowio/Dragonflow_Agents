'use client'

import { Badge } from '@/components/ui/badge'
import type { ToolDefinition } from '@/lib/types/agent'
import type { ToolConfig, ToolMode } from '@/lib/playground/tool-registry'

export function ToolRegistryPanel({
  tools,
  value,
  onChange,
}: {
  tools: ToolDefinition[]
  value: ToolConfig
  onChange: (next: ToolConfig) => void
}) {
  if (!tools.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/70 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">Tools</h3>
        <p className="mt-1 text-xs text-muted">
          Per tool, choose how to handle calls during this run. Stubs return a deterministic
          payload so the agent loop terminates without a real HTTP call. MCP tools are
          disabled in v0.1 — the runtime does not yet ship an MCP HTTP proxy.
        </p>
      </div>

      <div className="space-y-2">
        {tools.map((tool, index) => {
          const name = tool.name ?? `tool_${index}`
          const isMcp = tool.type === 'mcp'
          const current: ToolMode = isMcp ? 'disabled' : (value[name] ?? 'disabled')

          return (
            <div
              key={`${name}-${index}`}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border/80 bg-background/60 px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium" title={name}>
                    {name}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {tool.type}
                  </Badge>
                </div>
                {tool.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{tool.description}</p>
                ) : null}
              </div>

              <select
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isMcp}
                value={current}
                onChange={(event) =>
                  onChange({ ...value, [name]: event.target.value as ToolMode })
                }
                title={isMcp ? 'MCP HTTP proxy not in v0.1' : undefined}
              >
                <option value="disabled">Disabled</option>
                {!isMcp ? <option value="stub">Stub</option> : null}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
