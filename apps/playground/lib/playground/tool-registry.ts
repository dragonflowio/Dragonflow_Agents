import {
  createToolRegistry,
  type ToolRegistry,
} from '@dragonflowio/agent-runtime'
import { z } from 'zod'

import type { ToolDefinition } from '@/lib/types/agent'

export type ToolMode = 'disabled' | 'stub'

export type ToolConfig = Record<string, ToolMode>

export function buildToolRegistry(
  tools: ToolDefinition[] | undefined,
  config: ToolConfig
): ToolRegistry | undefined {
  if (!tools?.length) {
    return undefined
  }

  const registry = createToolRegistry()
  let registered = 0

  for (const tool of tools) {
    if (!tool.name || tool.type !== 'function') {
      continue
    }
    if (config[tool.name] !== 'stub') {
      continue
    }

    registry.register(tool.name, {
      description: tool.description ?? '',
      schema: z.any(),
      handler: async (input) => ({
        stub: true,
        name: tool.name,
        arguments: input,
      }),
    })
    registered++
  }

  return registered > 0 ? registry : undefined
}
