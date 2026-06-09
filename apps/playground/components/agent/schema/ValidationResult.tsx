'use client'

export function ValidationResult({
  result,
}: {
  result:
    | { status: 'idle' }
    | { status: 'unavailable'; message: string }
    | { status: 'parse_error'; message: string }
    | { status: 'valid' }
    | { status: 'invalid'; errors: { instancePath: string; message?: string }[] }
}) {
  if (result.status === 'idle') {
    return (
      <div className="rounded-2xl border border-border bg-surface/70 p-4 text-sm text-muted">
        Paste JSON to see validation results.
      </div>
    )
  }

  if (result.status === 'unavailable') {
    return (
      <div className="rounded-2xl border border-border bg-surface/70 p-4 text-sm text-muted">
        {result.message}
      </div>
    )
  }

  if (result.status === 'parse_error') {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Invalid JSON syntax: {result.message}
      </div>
    )
  }

  if (result.status === 'valid') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        Valid JSON. This payload matches the configured output schema.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
      <div className="text-sm font-medium text-destructive">Schema validation failed</div>
      <div className="mt-3 space-y-2">
        {result.errors.map((error, index) => (
          <div key={`${error.instancePath}-${index}`} className="rounded-lg border border-destructive/20 bg-background/40 px-3 py-2 text-sm text-destructive">
            <span className="font-medium">{error.instancePath || '/'}</span>
            <span className="mx-2 text-destructive/60">·</span>
            <span>{error.message ?? 'Schema mismatch'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
