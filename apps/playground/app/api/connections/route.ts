import { NextResponse } from 'next/server'
import { decrypt, encrypt, maskKey } from '@/lib/crypto'
import { createServerClient } from '@/lib/supabase/server'
import { isServiceRoleKey } from '@/lib/supabase/key'
import { Connection, ConnectionPublic } from '@/lib/types/connection'

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('connections')
      .select('id, name, supabase_url, service_role_key_enc, pat_enc, created_at')
      .order('name', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const publicData: ConnectionPublic[] = (data ?? []).map((c: Connection) => ({
      id: c.id,
      name: c.name,
      supabase_url: c.supabase_url,
      masked_key: maskKey(decrypt(c.service_role_key_enc)),
      has_pat: !!c.pat_enc,
      created_at: c.created_at,
    }))

    return NextResponse.json(publicData)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, supabase_url, service_role_key, pat } = await request.json()

    if (!name?.trim() || !supabase_url?.trim() || !service_role_key?.trim()) {
      return NextResponse.json({ error: 'name, supabase_url, and service_role_key are required' }, { status: 400 })
    }
    if (!isServiceRoleKey(service_role_key.trim())) {
      return NextResponse.json({ error: 'service_role_key must be a Supabase service role key' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('connections')
      .insert({
        name: name.trim(),
        supabase_url: supabase_url.trim().replace(/\/$/, ''),
        service_role_key_enc: encrypt(service_role_key.trim()),
        pat_enc: pat?.trim() ? encrypt(pat.trim()) : null,
      })
      .select('id, name, supabase_url, service_role_key_enc, pat_enc, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const result: ConnectionPublic = {
      id: data.id,
      name: data.name,
      supabase_url: data.supabase_url,
      masked_key: maskKey(service_role_key.trim()),
      has_pat: !!pat,
      created_at: data.created_at,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
