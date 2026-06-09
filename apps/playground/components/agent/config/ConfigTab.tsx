'use client'

import { useState } from 'react'
import { Agent } from '@/lib/types/agent'
import { BasicFields } from './BasicFields'
import { ToolEditor } from './ToolEditor'
import { FteEditor } from './FteEditor'
import { SlackChannelEditor } from './SlackChannelEditor'
import { PromptIdField } from './PromptIdField'
import { NextAgentField } from './NextAgentField'
import { RawJsonEditor } from './RawJsonEditor'
import { VoiceConfigEditor } from './VoiceConfigEditor'
import { SaveBar } from './SaveBar'

export function ConfigTab({ agent }: { agent: Agent }) {
  const [localAgent, setLocalAgent] = useState<Agent>(agent)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  function updateAgent(updates: Partial<Agent>) {
    setLocalAgent(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/agents/${localAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localAgent),
      })
      if (!res.ok) throw new Error('Save failed')
      const savedAgent = await res.json()
      setLocalAgent(savedAgent)
      setIsDirty(false)
    } catch (err) {
      console.error(err)
      // Phase 5 will add toast notifications
    } finally {
      setIsSaving(false)
    }
  }

  function handleDiscard() {
    setLocalAgent(agent)
    setIsDirty(false)
  }

  return (
    <div className="relative space-y-8 pb-24">
      {/* Basic fields */}
      <BasicFields agent={localAgent} onChange={updateAgent} />

      {/* Prompt ID — if set */}
      {localAgent.prompt_id && <PromptIdField promptId={localAgent.prompt_id} />}

      {/* Tool editor */}
      <ToolEditor agent={localAgent} onChange={updateAgent} />

      {/* FTE editor */}
      <FteEditor agent={localAgent} onChange={updateAgent} />

      {/* Slack channels */}
      <SlackChannelEditor agent={localAgent} onChange={updateAgent} />

      {/* Next agent link */}
      {localAgent.next_agent_id && <NextAgentField nextAgentId={localAgent.next_agent_id} />}

      {/* Voice config editor */}
      {localAgent.voice_config !== null && (
        <VoiceConfigEditor agent={localAgent} onChange={updateAgent} />
      )}

      {/* Raw JSON fallback */}
      <RawJsonEditor agent={localAgent} onChange={updateAgent} />

      {/* Sticky save bar */}
      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  )
}
