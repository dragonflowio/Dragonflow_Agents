import { Agent } from '@/lib/types/agent'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigTab } from './config/ConfigTab'
import { PlaygroundTab } from './playground/PlaygroundTab'
import { SchemaTab } from './schema/SchemaTab'

export function AgentTabs({ agent }: { agent: Agent }) {
  const hasVoice = agent.voice_config !== null

  return (
    <Tabs defaultValue="config" className="flex-1 flex flex-col mt-4">
      <div className="px-6">
        <TabsList>
          <TabsTrigger value="config">Config</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
          {hasVoice && <TabsTrigger value="voice">Voice</TabsTrigger>}
          <TabsTrigger value="schema">Schema</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      </div>
      
      <div className="flex-1 p-6 overflow-auto">
        <TabsContent value="config" className="mt-0 h-full">
          <ConfigTab agent={agent} />
        </TabsContent>
        
        <TabsContent value="playground" className="mt-0 h-full">
          <PlaygroundTab agent={agent} />
        </TabsContent>
        
        {hasVoice && (
          <TabsContent value="voice" className="mt-0 h-full">
            <div className="text-muted text-sm">Coming in Phase 4...</div>
          </TabsContent>
        )}
        
        <TabsContent value="schema" className="mt-0 h-full">
          <SchemaTab agent={agent} />
        </TabsContent>
        
        <TabsContent value="history" className="mt-0 h-full">
          <div className="text-muted text-sm">Coming in Phase 5...</div>
        </TabsContent>
      </div>
    </Tabs>
  )
}
