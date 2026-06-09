import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pat = searchParams.get('pat')

  if (!pat) return NextResponse.json({ error: 'pat is required' }, { status: 400 })

  try {
    const res = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${pat}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Invalid PAT or Supabase API error' }, { status: 400 })
    }

    const projects: Array<{ id: string; name: string }> = await res.json()
    const list = projects.map((p) => ({
      name: p.name,
      supabase_url: `https://${p.id}.supabase.co`,
    }))

    return NextResponse.json(list)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
