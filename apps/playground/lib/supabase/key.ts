function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

export function getSupabaseKeyRole(token: string): string | null {
  const payload = decodeJwtPayload(token)
  const role = payload?.role
  return typeof role === 'string' ? role : null
}

export function isServiceRoleKey(token: string): boolean {
  return getSupabaseKeyRole(token) === 'service_role'
}
