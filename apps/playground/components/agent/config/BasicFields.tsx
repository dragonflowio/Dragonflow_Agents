'use client'

import { useEffect, useState } from 'react'
import { Agent, getProvider } from '@/lib/types/agent'
import { Model } from '@/lib/types/model'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Project } from '@/lib/types/project'

export function BasicFields({
  agent,
  onChange
}: {
  agent: Agent
  onChange: (updates: Partial<Agent>) => void
}) {
  const provider = getProvider(agent.model)
  const [projects, setProjects] = useState<Project[]>([])
  const [models, setModels] = useState<Model[]>([])

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setProjects(data) })
      .catch(console.error)

    fetch('/api/models')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setModels(d.filter((m: Model) => m.is_active)) })
      .catch(console.error)
  }, [])

  const handleConfigChange = (field: string, value: any) => {
    onChange({
      config: {
        ...agent.config,
        [field]: value
      }
    })
  }

  const handleFloatChange = (field: string, value: string) => {
    const num = parseFloat(value)
    handleConfigChange(field, isNaN(num) ? undefined : num)
  }

  const handleIntChange = (field: string, value: string) => {
    const num = parseInt(value, 10)
    handleConfigChange(field, isNaN(num) ? undefined : num)
  }

  const modelGroups = ['openai', 'anthropic', 'google', 'openrouter']
    .map(providerName => ({
      providerName,
      models: models.filter(m => m.provider === providerName)
    }))
    .filter(group => group.models.length > 0)
  const hasListedModel = !!agent.model && models.some(m => m.model_id === agent.model)
  const showUnlistedModel = !!agent.model && !hasListedModel

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wide">Basic Settings</h3>

      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={agent.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Agent name"
        />
      </div>

      <div className="space-y-2">
        <Label>Project</Label>
        <Select
          value={agent.project_id ?? ''}
          onValueChange={(val) => onChange({ project_id: val || null })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Unassigned">
              {agent.project_id && projects.length > 0
                ? (projects.find(p => p.id === agent.project_id)?.name ?? undefined)
                : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>System Instruction</Label>
        <Textarea
          value={agent.system_instruction || ''}
          onChange={(e) => onChange({ system_instruction: e.target.value })}
          rows={4}
          className="resize-y min-h-[100px]"
          placeholder="You are an AI assistant..."
        />
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        <div className="flex items-center gap-3">
          <Select
            value={agent.model ?? ''}
            onValueChange={(val) => onChange({ model: val || null })}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a model">
                {showUnlistedModel ? agent.model : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {showUnlistedModel && (
                <>
                  <SelectGroup>
                    <SelectLabel>Current</SelectLabel>
                    <SelectItem value={agent.model!}>
                      <span className="flex w-full items-center justify-between gap-2">
                        <span>{agent.model}</span>
                        <span className="text-xs text-muted">unlisted</span>
                      </span>
                    </SelectItem>
                  </SelectGroup>
                  {modelGroups.length > 0 && <SelectSeparator />}
                </>
              )}
              {modelGroups.map(({ providerName, models: groupedModels }, i) => {
                return (
                  <SelectGroup key={providerName}>
                    {i > 0 && <SelectSeparator />}
                    <SelectLabel className="capitalize">{providerName}</SelectLabel>
                    {groupedModels.map(m => (
                      <SelectItem key={m.id} value={m.model_id}>{m.label}</SelectItem>
                    ))}
                  </SelectGroup>
                )
              })}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="capitalize w-24 justify-center">
            {provider}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label>Temperature</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[agent.config?.temperature ?? 1]}
              min={0}
              max={2}
              step={0.01}
              onValueChange={(val) => handleConfigChange('temperature', Array.isArray(val) ? val[0] : val)}
              className="flex-1"
            />
            <Input
              type="number"
              value={agent.config?.temperature ?? 1}
              onChange={(e) => handleFloatChange('temperature', e.target.value)}
              step="0.01"
              min="0"
              max="2"
              className="w-20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Max Tokens</Label>
          <Input
            type="number"
            value={agent.config?.max_tokens ?? ''}
            onChange={(e) => handleIntChange('max_tokens', e.target.value)}
            placeholder="No limit"
          />
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
          <Input
            value={agent.config?.language ?? ''}
            onChange={(e) => handleConfigChange('language', e.target.value)}
            placeholder="e.g. en, es"
          />
        </div>

        <div className="space-y-2">
          <Label>Output Format</Label>
          <Input
            value={agent.config?.output_format ?? ''}
            onChange={(e) => handleConfigChange('output_format', e.target.value)}
            placeholder="e.g. json, text"
          />
        </div>
      </div>
    </div>
  )
}
