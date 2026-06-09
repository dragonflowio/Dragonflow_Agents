import { NextResponse } from 'next/server'
import { decrypt, encrypt, maskKey } from '@/lib/crypto'
import { createServerClient } from '@/lib/supabase/server'
import { isServiceRoleKey } from '@/lib/supabase/key'
import { ConnectionPublic } from '@/lib/types/connection'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { name, service_role_key, pat } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { name: name.trim() }
    if (service_role_key?.trim()) {
      if (!isServiceRoleKey(service_role_key.trim())) {
        return NextResponse.json({ error: 'service_role_key must be a Supabase service role key' }, { status: 400 })
      }
      updates.service_role_key_enc = encrypt(service_role_key.trim())
    }
    if (pat !== undefined) {
      updates.pat_enc = pat?.trim() ? encrypt(pat.trim()) : null
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('connections')
      .update(updates)
      .eq('id', id)
      .select('id, name, supabase_url, service_role_key_enc, pat_enc, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const result: ConnectionPublic = {
      id: data.id,
      name: data.name,
      supabase_url: data.supabase_url,
      masked_key: maskKey(
        service_role_key?.trim() ? service_role_key.trim() : decrypt(data.service_role_key_enc)
      ),
      has_pat: !!data.pat_enc,
      created_at: data.created_at,
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const supabase = createServerClient()
    const { error } = await supabase.from('connections').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
