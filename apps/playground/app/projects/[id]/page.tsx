import { notFound } from 'next/navigation'
import { getActiveAdapter } from '@/lib/adapters/factory'
import { ProjectAgentTable } from '@/components/project/ProjectAgentTable'
import { CreateAgentDialog } from '@/components/sidebar/CreateAgentDialog'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const adapter = await getActiveAdapter()

  const [project, agents] = await Promise.all([
    adapter.getProject(id),
    adapter.getAgents({ project_id: id }),
  ])

  if (!project) return notFound()

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border bg-surface/30 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <CreateAgentDialog defaultProjectId={id} />
      </div>
      <ProjectAgentTable agents={agents} />
    </div>
  )
}
