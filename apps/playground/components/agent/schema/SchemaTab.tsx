'use client'

import { useEffect, useMemo, useState } from 'react'
import Ajv from 'ajv'
import Editor from '@monaco-editor/react'
import { Agent } from '@/lib/types/agent'
import { Button } from '@/components/ui/button'
import { ValidationResult } from './ValidationResult'
import { ValidatorInput } from './ValidatorInput'

const ajv = new Ajv({ allErrors: true })

export function SchemaTab({ agent }: { agent: Agent }) {
  const [localConfig, setLocalConfig] = useState<Record<string, unknown>>(normalizeConfig(agent.config))
  const [configText, setConfigText] = useState('')
  const [configError, setConfigError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [candidate, setCandidate] = useState('')

  useEffect(() => {
    const nextConfig = normalizeConfig(agent.config)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- prop→state mirror; refactor planned in Plan 5
    setLocalConfig(nextConfig)
    setConfigText(JSON.stringify(nextConfig, null, 2))
    setConfigError(null)
    setIsDirty(false)
  }, [agent.config])

  const schema = isRecord(localConfig.output_schema) ? localConfig.output_schema : null

  const schemaSupport = useMemo(() => {
    if (!schema) {
      return {
        available: false as const,
        message:
          'No `output_schema` found in this config. You can still inspect and edit custom keys like `analysis_schema` here.',
      }
    }

    try {
      const validate = ajv.compile(schema)
      return { available: true as const, validate }
    } catch (error) {
      return {
        available: false as const,
        message:
          error instanceof Error
            ? `\`output_schema\` is present but cannot be used for JSON Schema validation: ${error.message}`
            : '`output_schema` is present but cannot be used for JSON Schema validation.',
      }
    }
  }, [schema])

  const result = useMemo(() => {
    if (!schemaSupport.available) {
      return {
        status: 'unavailable' as const,
        message: schemaSupport.message,
      }
    }

    if (!candidate.trim()) {
      return { status: 'idle' as const }
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(candidate)
    } catch (error) {
      return {
        status: 'parse_error' as const,
        message: error instanceof Error ? error.message : 'Unable to parse JSON.',
      }
    }

    const isValid = schemaSupport.validate(parsedJson)
    if (isValid) {
      return { status: 'valid' as const }
    }

    return {
      status: 'invalid' as const,
      errors: (schemaSupport.validate.errors ?? []).map(normalizeValidationError),
    }
  }, [candidate, schemaSupport])

  function handleConfigChange(value: string | undefined) {
    const nextValue = value ?? ''
    setConfigText(nextValue)

    try {
      const parsed = JSON.parse(nextValue)
      if (!isRecord(parsed)) {
        setConfigError('Config must be a JSON object at the top level.')
        return
      }

      setLocalConfig(parsed)
      setConfigError(null)
      setIsDirty(true)
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : 'Invalid JSON.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h3 className="text-sm font-semibold">Agent Config</h3>
            <p className="mt-1 text-xs leading-6 text-muted">
              Temporary fallback for heterogeneous schema keys. Edit the full `config` object here,
              including custom entries like `analysis_schema`. The value still needs to be valid JSON
              to save because it is stored as JSON in the database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const nextConfig = normalizeConfig(agent.config)
                setLocalConfig(nextConfig)
                setConfigText(JSON.stringify(nextConfig, null, 2))
                setConfigError(null)
                setIsDirty(false)
              }}
              disabled={!isDirty && !configError}
            >
              Discard
            </Button>
            <Button
              onClick={async () => {
                if (configError) {
                  return
                }

                setIsSaving(true)
                try {
                  const response = await fetch(`/api/agents/${agent.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config: localConfig }),
                  })

                  if (!response.ok) {
                    throw new Error('Save failed.')
                  }

                  const savedAgent = (await response.json()) as Agent
                  const nextConfig = normalizeConfig(savedAgent.config)
                  setLocalConfig(nextConfig)
                  setConfigText(JSON.stringify(nextConfig, null, 2))
                  setConfigError(null)
                  setIsDirty(false)
                } catch (error) {
                  setConfigError(error instanceof Error ? error.message : 'Save failed.')
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={Boolean(configError) || !isDirty || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save config'}
            </Button>
          </div>
        </div>

        <div className="mt-4 h-[420px] overflow-hidden rounded-xl border border-border/70 bg-background/70">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={configText}
            onChange={handleConfigChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              formatOnPaste: true,
              autoIndent: 'full',
              tabSize: 2,
            }}
          />
        </div>

        {configError ? (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {configError}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ValidationResult result={result} />
        <ValidatorInput value={candidate} onChange={setCandidate} disabled={!schemaSupport.available} />
      </div>
    </div>
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeConfig(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function normalizeValidationError(error: unknown) {
  const candidate = isRecord(error) ? error : null

  return {
    instancePath: typeof candidate?.instancePath === 'string'
      ? candidate.instancePath
      : typeof candidate?.dataPath === 'string'
        ? candidate.dataPath
        : '',
    message: typeof candidate?.message === 'string' ? candidate.message : undefined,
  }
}
