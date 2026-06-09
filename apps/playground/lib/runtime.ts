import 'server-only'

import { createRuntime, type Runtime } from '@dragonflowio/agent-runtime'

import { createServerClient } from '@/lib/supabase/server'

let cached: Runtime | null = null

export function getPlaygroundRuntime(): Runtime {
  if (cached) {
    return cached
  }

  cached = createRuntime({
    supabase: { client: createServerClient() },
  })

  return cached
}
