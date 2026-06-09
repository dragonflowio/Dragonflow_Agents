import 'server-only'

import { NextResponse } from 'next/server'
import {
  serializeError,
  type SerializedRuntimeError,
} from '@dragonflowio/agent-runtime'
import { z } from 'zod'

import { buildToolRegistry, type ToolConfig } from '@/lib/playground/tool-registry'
import { getPlaygroundRuntime } from '@/lib/runtime'
import type { ToolDefinition } from '@/lib/types/agent'

const BodySchema = z.object({
  slug: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.union([z.literal('user'), z.literal('assistant')]),
        content: z.string(),
      })
    )
    .min(1),
  system: z.string().optional(),
  toolConfig: z.record(z.union([z.literal('disabled'), z.literal('stub')])).optional(),
})

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await safeJson(req))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  const { slug, messages, system, toolConfig } = parsed.data
  const runtime = getPlaygroundRuntime()

  let row
  try {
    row = await runtime.loader.load(slug)
  } catch (err) {
    return errorResponse(err)
  }

  const agentTools = readToolDefinitions(row.config)
  const registry = buildToolRegistry(agentTools, (toolConfig ?? {}) as ToolConfig)
  const hasOutputSchema = Boolean(row.config['output_schema'])

  try {
    const result = await runtime.invoke({
      slug,
      input: { messages, ...(system ? { system } : {}) },
      ...(registry ? { tools: registry } : {}),
      ...(hasOutputSchema ? { schema: z.any() } : {}),
    })

    return NextResponse.json({
      output: result.output,
      raw: result.raw,
      usage: result.usage,
      agent: result.agent,
    })
  } catch (err) {
    return errorResponse(err)
  }
}

function readToolDefinitions(config: Record<string, unknown>): ToolDefinition[] | undefined {
  const tools = config['tools']
  return Array.isArray(tools) ? (tools as ToolDefinition[]) : undefined
}

async function safeJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return null
  }
}

function errorResponse(err: unknown) {
  const serialized = serializeError(err)
  const status = statusFor(serialized)
  return NextResponse.json(serialized, { status })
}

function statusFor(err: SerializedRuntimeError): number {
  switch (err.type) {
    case 'load':
      return 404
    case 'validate':
      return 422
    case 'parse':
    case 'provider':
      return 502
    case 'tool':
      return 500
    default:
      return 500
  }
}
