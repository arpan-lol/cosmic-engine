'use client'

import {
  HelpCircle,
  List,
  Settings,
} from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'

const data = {
  navMain: [
    {
      title: 'Sessions',
      url: '/dashboard/sessions',
      icon: List,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: Settings,
    },
    {
      title: 'Help',
      url: '/dashboard/help',
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: authUser } = useAuth()
  const [user, setUser] = useState<{
    name: string
    email: string
    avatar: string
  }>()

  useEffect(() => {
    if (authUser) {
      setUser({
        name: authUser.name || 'User',
        email: authUser.email,
        avatar: authUser.picture || '',
      })
    }
  }, [authUser])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  CE
                </div>
                <span className="text-base font-semibold">Cosmic Engine</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
