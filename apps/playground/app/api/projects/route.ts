import { NextResponse } from 'next/server'
import { getActiveAdapter } from '@/lib/adapters/factory'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const adapter = await getActiveAdapter()
    const data = await adapter.getProjects()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: name.trim() })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
