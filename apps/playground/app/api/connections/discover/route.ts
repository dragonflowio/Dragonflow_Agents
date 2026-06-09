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

    const projects = await res.json()
    const list = projects.map((p: any) => ({
      name: p.name,
      supabase_url: `https://${p.id}.supabase.co`,
    }))

    return NextResponse.json(list)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
