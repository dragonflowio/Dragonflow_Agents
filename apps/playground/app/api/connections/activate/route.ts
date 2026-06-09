import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/crypto'
import { createServerClient } from '@/lib/supabase/server'
import { isServiceRoleKey } from '@/lib/supabase/key'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    const cookieStore = await cookies()

    if (!id || id === 'home') {
      cookieStore.delete('active-connection-id')
    } else {
      const supabase = createServerClient()
      const { data: conn, error } = await supabase
        .from('connections')
        .select('service_role_key_enc')
        .eq('id', id)
        .single()

      if (error || !conn) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      }

      if (!isServiceRoleKey(decrypt(conn.service_role_key_enc))) {
        cookieStore.delete('active-connection-id')
        return NextResponse.json(
          { error: 'Saved connection key is not a Supabase service role key' },
          { status: 400 }
        )
      }

      cookieStore.set('active-connection-id', id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
