import { ConnectionManager } from '@/components/settings/ConnectionManager'
import { ModelManager } from '@/components/settings/ModelManager'
import { ProjectManager } from '@/components/settings/ProjectManager'

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage projects, models, and connections.</p>
      </div>
      <ConnectionManager />
      <ModelManager />
      <ProjectManager />
    </div>
  )
}
