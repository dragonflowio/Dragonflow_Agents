import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import { TopNav } from '@/components/layout/TopNav'
import { ProjectList } from '@/components/sidebar/ProjectList'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata: Metadata = {
  title: 'Agent Playground',
  description: 'Browse, configure, and test LLM agents',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const activeConnectionId = cookieStore.get('active-connection-id')?.value ?? 'home'

  return (
    <html lang="en" className="dark">
      <body className="flex flex-col h-screen overflow-hidden bg-background">
        <TooltipProvider>
          <TopNav initialActiveId={activeConnectionId} />
          <div className="flex flex-1 overflow-hidden">
            <aside className="w-[260px] shrink-0 border-r border-border flex flex-col overflow-hidden">
              <ProjectList activeConnectionId={activeConnectionId} />
            </aside>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </TooltipProvider>
      </body>
    </html>
  )
}
