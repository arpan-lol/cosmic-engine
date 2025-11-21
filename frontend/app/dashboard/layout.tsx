'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <div className="flex-1 flex flex-col p-4 pt-0 min-h-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
