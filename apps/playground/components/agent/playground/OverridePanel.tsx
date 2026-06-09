'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { PlaygroundOverrides } from './types'

export function OverridePanel({
  overrides,
  onChange,
}: {
  overrides: PlaygroundOverrides
  onChange: (overrides: PlaygroundOverrides) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/70 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Run Overrides</h3>
        <p className="mt-1 text-xs text-muted">
          These values affect only the next request and never write back to the database.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Label>Temperature</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[overrides.temperature ?? 1]}
              min={0}
              max={2}
              step={0.01}
              onValueChange={(value) => onChange({
                ...overrides,
                temperature: Array.isArray(value) ? value[0] : value,
              })}
              className="flex-1"
            />
            <Input
              type="number"
              value={overrides.temperature ?? 1}
              onChange={(event) => onChange({
                ...overrides,
                temperature: normalizeNumber(event.target.value, overrides.temperature ?? 1),
              })}
              min="0"
              max="2"
              step="0.01"
              className="w-24"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Max Tokens</Label>
          <Input
            type="number"
            value={overrides.max_tokens ?? ''}
            placeholder="Use agent default"
            onChange={(event) => onChange({
              ...overrides,
              max_tokens: event.target.value === '' ? undefined : normalizeNumber(event.target.value),
            })}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-3">
        <div>
          <div className="text-sm font-medium">Use agent system instruction</div>
          <div className="text-xs text-muted">Turn this off to test with only the conversation messages.</div>
        </div>
        <Switch
          checked={overrides.useSystemInstruction}
          onCheckedChange={(checked) => onChange({ ...overrides, useSystemInstruction: checked })}
        />
      </div>
    </div>
  )
}

function normalizeNumber(value: string, fallback?: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
