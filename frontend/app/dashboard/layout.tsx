'use client'

import { AppSidebar } from '@/components/Sidebar'
import { PendingSessionUploadsProvider } from '@/contexts/PendingSessionUploadsContext'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SessionEventsProvider } from '@/contexts/SessionEventsContext'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const sessionId = pathname?.match(/\/dashboard\/sessions\/([^\/]+)/)?.[1] || null

  return (
    <PendingSessionUploadsProvider>
      <SessionEventsProvider sessionId={sessionId}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex flex-col h-screen overflow-hidden">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </SessionEventsProvider>
    </PendingSessionUploadsProvider>
  )
}
