import { NextResponse } from 'next/server'
import { getActiveAdapter } from '@/lib/adapters/factory'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')?.trim() ?? ''
    const unassigned = searchParams.get('unassigned') === '1'
    const adapter = await getActiveAdapter()
    const data = await adapter.getAgents({
      ...(projectId ? { project_id: projectId } : {}),
      ...(unassigned ? { unassigned: true } : {}),
    })

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('agents')
      .insert(body)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
