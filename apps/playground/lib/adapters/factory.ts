import { cookies } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/crypto'
import { isServiceRoleKey } from '@/lib/supabase/key'
import { HomeAdapter } from './home'
import { RemoteAdapter } from './remote'

export async function getActiveAdapter(): Promise<HomeAdapter | RemoteAdapter> {
  const cookieStore = await cookies()
  const connectionId = cookieStore.get('active-connection-id')?.value

  if (!connectionId || connectionId === 'home') {
    return new HomeAdapter()
  }

  const supabase = createServerClient()
  const { data: conn } = await supabase
    .from('connections')
    .select('supabase_url, service_role_key_enc')
    .eq('id', connectionId)
    .single()

  if (!conn) return new HomeAdapter()

  const serviceKey = decrypt(conn.service_role_key_enc)
  if (!isServiceRoleKey(serviceKey)) {
    console.warn(`Connection ${connectionId} has a non-service Supabase key; falling back to home adapter`)
    return new HomeAdapter()
  }

  return new RemoteAdapter(conn.supabase_url, serviceKey)
}
