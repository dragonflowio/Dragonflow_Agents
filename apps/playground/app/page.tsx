import { redirect } from 'next/navigation'
import { getActiveAdapter } from '@/lib/adapters/factory'

export default async function Home() {
  const adapter = await getActiveAdapter()
  const projects = await adapter.getProjects()

  if (projects.length > 0) {
    redirect(`/projects/${projects[0].id}`)
  }

  return (
    <div className="flex items-center justify-center h-full text-muted">
      <p>No projects found.</p>
    </div>
  )
}
