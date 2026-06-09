'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Inbox, Settings } from 'lucide-react'
import { Project } from '@/lib/types/project'
import { ProjectListItem } from './ProjectListItem'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ProjectList({ activeConnectionId }: { activeConnectionId: string }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [hasUnassignedAgents, setHasUnassignedAgents] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  const loadProjects = useCallback(() => {
    setIsLoading(true)
    Promise.all([
      fetch('/api/projects', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/agents?unassigned=1', { cache: 'no-store' }).then((res) => res.json()),
    ])
      .then(([projectData, agentData]) => {
        if (Array.isArray(projectData)) {
          setProjects(projectData)
        }

        setHasUnassignedAgents(Array.isArray(agentData) && agentData.length > 0)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    loadProjects()
  }, [activeConnectionId, loadProjects])

  useEffect(() => {
    const handleConnectionChange = () => {
      loadProjects()
    }

    window.addEventListener('active-connection-change', handleConnectionChange)
    return () => {
      window.removeEventListener('active-connection-change', handleConnectionChange)
    }
  }, [loadProjects])

  return (
    <div className="flex flex-col h-full bg-surface/30">
      <ScrollArea className="flex-1">
        <div className="py-2">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted">Loading...</div>
          ) : projects.length === 0 && !hasUnassignedAgents ? (
            <div className="p-4 text-center text-sm text-muted">No projects found</div>
          ) : (
            <>
              {projects.map(project => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  isActive={pathname?.startsWith(`/projects/${project.id}`) ?? false}
                />
              ))}

              {hasUnassignedAgents ? (
                <Link
                  href="/projects/unassigned"
                  className={`flex items-center gap-2 border-l-2 px-4 py-2.5 text-sm transition-colors duration-150 ${
                    pathname?.startsWith('/projects/unassigned')
                      ? 'border-accent bg-accent/10 text-white'
                      : 'border-transparent text-muted hover:bg-surface/50 hover:text-white'
                  }`}
                >
                  <Inbox size={16} />
                  Unassigned
                </Link>
              ) : null}
            </>
          )}
        </div>
      </ScrollArea>
      <div className="border-t border-border p-3">
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
            pathname === '/settings'
              ? 'text-white bg-surface/50'
              : 'text-muted hover:text-white hover:bg-surface/50'
          }`}
        >
          <Settings size={16} />
          Settings
        </Link>
      </div>
    </div>
  )
}
