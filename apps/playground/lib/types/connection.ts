export interface Connection {
  id: string
  name: string
  supabase_url: string
  service_role_key_enc: string
  pat_enc?: string | null
  created_at: string
}

export interface ConnectionPublic {
  id: string
  name: string
  supabase_url: string
  masked_key: string
  has_pat: boolean
  created_at: string
}
