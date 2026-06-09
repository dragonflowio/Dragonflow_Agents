import { ChatMessage, ToolCall } from '@/lib/chat-types'

export interface PlaygroundAttachment {
  filename: string
  mimeType: string
  previewUrl?: string
  file?: File
}

export interface PlaygroundMessage extends Pick<ChatMessage, 'role' | 'content'> {
  id: string
  toolCalls?: ToolCall[]
  error?: string
  attachments?: PlaygroundAttachment[]
}

export interface PlaygroundOverrides {
  temperature?: number
  max_tokens?: number
  useSystemInstruction: boolean
}
