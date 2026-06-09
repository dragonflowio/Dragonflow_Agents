'use client'

export function SchemaViewer({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/70 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">Output Schema</h3>
        <p className="mt-1 text-xs text-muted">Read-only view of the agent&apos;s configured JSON schema.</p>
      </div>
      <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/70 bg-background/70 p-4 text-xs text-muted">
        {JSON.stringify(schema, null, 2)}
      </pre>
    </div>
  )
}
