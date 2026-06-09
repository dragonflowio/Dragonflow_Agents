import { Agent } from '@/lib/types/agent'
import { Project } from '@/lib/types/project'
import { createServerClient } from '@/lib/supabase/server'
import { DataAdapter } from './adapter'

export class HomeAdapter implements DataAdapter {
  private supabase = createServerClient()

  async getProjects(): Promise<Project[]> {
    const { data } = await this.supabase
      .from('projects')
      .select('*')
      .order('name', { ascending: true })
    return data ?? []
  }

  async getProject(id: string): Promise<Project | null> {
    const { data } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    return data ?? null
  }

  async getAgents(filters?: { project_id?: string; unassigned?: boolean }): Promise<Agent[]> {
    let query = this.supabase.from('agents').select('*').order('name', { ascending: true })
    if (filters?.project_id) query = query.eq('project_id', filters.project_id)
    if (filters?.unassigned) query = query.is('project_id', null)
    const { data } = await query
    return data ?? []
  }

  async getAgent(id: string): Promise<Agent | null> {
    const { data } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()
    return data ?? null
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    const { data, error } = await this.supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  async createAgent(data: Partial<Agent>): Promise<Agent> {
    const { data: created, error } = await this.supabase
      .from('agents')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return created
  }

  async deleteAgent(id: string): Promise<void> {
    const { error } = await this.supabase.from('agents').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}
