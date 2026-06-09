import { Agent } from '@/lib/types/agent'
import { Project } from '@/lib/types/project'
import { DataAdapter } from './adapter'

export class RemoteAdapter implements DataAdapter {
  constructor(private baseUrl: string, private serviceKey: string) {}

  private async rest<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/rest/v1/${path}`
    const res = await fetch(url, {
      ...options,
      headers: {
        apikey: this.serviceKey,
        Authorization: `Bearer ${this.serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...options?.headers,
      },
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Remote Supabase error ${res.status}: ${await res.text()}`)
    if (res.status === 204) return undefined as T
    return res.json()
  }

  async getProjects(): Promise<Project[]> {
    return this.rest<Project[]>('projects?select=*&order=name.asc')
  }

  async getProject(id: string): Promise<Project | null> {
    const results = await this.rest<Project[]>(`projects?select=*&id=eq.${encodeURIComponent(id)}&limit=1`)
    return results[0] ?? null
  }

  async getAgents(filters?: { project_id?: string; unassigned?: boolean }): Promise<Agent[]> {
    let qs = 'order=name.asc'

    if (filters?.project_id) {
      qs = `project_id=eq.${encodeURIComponent(filters.project_id)}&${qs}`
    }

    if (filters?.unassigned) {
      qs = `project_id=is.null&${qs}`
    }

    return this.rest<Agent[]>(`agents?select=*&${qs}`)
  }

  async getAgent(id: string): Promise<Agent | null> {
    const results = await this.rest<Agent[]>(`agents?select=*&id=eq.${encodeURIComponent(id)}&limit=1`)
    return results[0] ?? null
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    const results = await this.rest<Agent[]>(`agents?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    return results[0]
  }

  async createAgent(data: Partial<Agent>): Promise<Agent> {
    const results = await this.rest<Agent[]>('agents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return results[0]
  }

  async deleteAgent(id: string): Promise<void> {
    await this.rest<void>(`agents?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' })
  }
}
