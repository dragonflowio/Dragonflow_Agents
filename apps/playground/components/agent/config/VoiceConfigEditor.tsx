'use client'

import { Agent } from '@/lib/types/agent'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function VoiceConfigEditor({
  agent,
  onChange
}: {
  agent: Agent
  onChange: (updates: Partial<Agent>) => void
}) {
  const vc = agent.voice_config

  if (!vc) return null // Handled externally to not render if null in v1

  const updateVc = (key: string, value: any) => {
    onChange({
      voice_config: {
        ...vc,
        [key]: value
      }
    })
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
      <h3 className="text-sm font-medium text-muted uppercase tracking-wide">Voice Configuration</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Synthesis Turn Type</Label>
          <Select
            value={vc.synthesis_turn_type || 'tts'}
            onValueChange={(val) => updateVc('synthesis_turn_type', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tts">TTS</SelectItem>
              <SelectItem value="ttv">TTV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-8">
          <Switch
            id="fillers"
            checked={vc.enable_fillers ?? false}
            onCheckedChange={(val) => updateVc('enable_fillers', val)}
          />
          <Label htmlFor="fillers">Enable Fillers</Label>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Switch
            id="emotions"
            checked={vc.has_emotions ?? false}
            onCheckedChange={(val) => updateVc('has_emotions', val)}
          />
          <Label htmlFor="emotions">Has Emotions</Label>
        </div>
      </div>
    </div>
  )
}
