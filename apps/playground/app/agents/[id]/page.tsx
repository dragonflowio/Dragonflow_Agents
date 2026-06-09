import { notFound } from 'next/navigation'
import { getActiveAdapter } from '@/lib/adapters/factory'
import { AgentHeader } from '@/components/agent/AgentHeader'
import { AgentTabs } from '@/components/agent/AgentTabs'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AgentPage({ params }: Props) {
  const { id } = await params
  const adapter = await getActiveAdapter()
  const agent = await adapter.getAgent(id)

  if (!agent) return notFound()

  return (
    <div className="flex flex-col h-full">
      <AgentHeader agent={agent} />
      <AgentTabs agent={agent} />
    </div>
  )
}
