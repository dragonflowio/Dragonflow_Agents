'use client'

import { Textarea } from '@/components/ui/textarea'

export function ValidatorInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/70 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">Candidate JSON</h3>
        <p className="mt-1 text-xs text-muted">
          Paste a JSON payload to validate it against `config.output_schema` when available.
        </p>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='{"status":"ok"}'
        className="min-h-[220px] resize-y bg-background/70 font-mono text-sm"
        disabled={disabled}
      />
    </div>
  )
}
