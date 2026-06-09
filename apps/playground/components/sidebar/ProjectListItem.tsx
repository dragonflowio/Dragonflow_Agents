'use client'

import Link from 'next/link'
import { Project } from '@/lib/types/project'

export function ProjectListItem({ project, isActive }: { project: Project; isActive: boolean }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className={`flex items-center px-4 py-2.5 text-sm transition-colors duration-150 border-l-2 ${
        isActive
          ? 'border-accent bg-accent/10 text-white'
          : 'border-transparent text-muted hover:text-white hover:bg-surface/50'
      }`}
    >
      {project.name}
    </Link>
  )
}
