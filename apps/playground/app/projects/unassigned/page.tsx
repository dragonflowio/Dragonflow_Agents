import { getActiveAdapter } from '@/lib/adapters/factory'
import { ProjectAgentTable } from '@/components/project/ProjectAgentTable'
import { CreateAgentDialog } from '@/components/sidebar/CreateAgentDialog'

export default async function UnassignedAgentsPage() {
  const adapter = await getActiveAdapter()
  const agents = await adapter.getAgents({ unassigned: true })

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface/30 px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Unassigned Agents</h1>
          <p className="mt-1 text-sm text-muted">
            Agents without a project stay accessible here until they&apos;re assigned elsewhere.
          </p>
        </div>

        <CreateAgentDialog />
      </div>

      <ProjectAgentTable agents={agents} />
    </div>
  )
}
