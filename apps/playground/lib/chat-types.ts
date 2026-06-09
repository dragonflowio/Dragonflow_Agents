export interface Attachment {
  filename: string
  mimeType: string
  base64: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  attachments?: Attachment[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: unknown
}
