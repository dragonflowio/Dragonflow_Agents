export type AgentModality = 'text' | 'voice' | 'realtime'
export type AgentProvider = 'openai' | 'google' | 'openrouter' | 'anthropic' | 'unknown'

export interface Agent {
  id: string
  name: string
  project_id: string | null
  system_instruction: string | null
  model: string | null
  voice_id: string | null
  config: AgentConfig | null
  voice_config: VoiceConfig | null
  prompt_id: string | null
  next_agent_id: string | null
  created_at: string
}

export interface AgentConfig {
  temperature?: number
  max_tokens?: number
  language?: string
  output_format?: string
  tools?: ToolDefinition[]
  fte?: FteConfig
  output_schema?: Record<string, unknown>
  slack_target_channels?: string[]
  is_default?: boolean
  [key: string]: unknown  // allow unknown keys for raw editing later
}

export interface ToolDefinition {
  type: 'function' | 'mcp'
  name?: string
  description?: string
  parameters?: Record<string, unknown>
  // MCP-specific
  server_url?: string
  server_label?: string
  allowed_tools?: string[]
  authorization?: string
  require_approval?: string
}

export interface FteConfig {
  mode: 'llm_init' | 'static'
  static_message?: string
}

export interface VoiceConfig {
  mode: 'text_only' | 'stt_tts' | 'realtime'
  synthesis_turn_type?: string
  enable_fillers?: boolean
  has_emotions?: boolean
  stt?: { model: string }
  tts?: { model: string; voice: string; speed: number }
  realtime?: {
    model: string
    voice: string
    turn_detection?: {
      type: string
      threshold: number
      prefix_padding_ms: number
      silence_duration_ms: number
    }
    input_audio_transcription?: { model: string }
  }
}

// Derived helpers
export function getProvider(model: string | null): AgentProvider {
  if (!model) return 'unknown'
  if (model.includes('gemini')) return 'google'
  if (model.includes('gpt') || model.includes('o1') || model.includes('o3')) return 'openai'
  if (model.includes('claude')) return 'anthropic'
  return 'openrouter'
}

export function getModality(voice_config: VoiceConfig | null): AgentModality {
  if (!voice_config || voice_config.mode === 'text_only') return 'text'
  if (voice_config.mode === 'stt_tts') return 'voice'
  return 'realtime'
}
