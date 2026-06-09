import { NextResponse } from 'next/server'
import { getActiveAdapter } from '@/lib/adapters/factory'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const adapter = await getActiveAdapter()
    const data = await adapter.getAgent(id)
    if (!data) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const adapter = await getActiveAdapter()
    const data = await adapter.updateAgent(id, body)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const adapter = await getActiveAdapter()
    await adapter.deleteAgent(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
