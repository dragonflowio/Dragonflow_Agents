import { Agent } from '@/lib/types/agent'
import { Project } from '@/lib/types/project'

export interface DataAdapter {
  getProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  getAgents(filters?: { project_id?: string; unassigned?: boolean }): Promise<Agent[]>
  getAgent(id: string): Promise<Agent | null>
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent>
  createAgent(data: Partial<Agent>): Promise<Agent>
  deleteAgent(id: string): Promise<void>
}
