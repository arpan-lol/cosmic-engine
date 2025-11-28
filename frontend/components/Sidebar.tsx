'use client'

import {
  HelpCircle,
  List,
  Settings,
  MessageSquare,
  Plus,
  PanelLeftClose,
} from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { NavMain } from '@/components/NavMain'
import { NavUser } from '@/components/NavUser'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { useConversations, useCreateConversation } from '@/hooks/use-conversations'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

const data = {
  navMain: [
    {
      title: 'Conversations',
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
  const { toggleSidebar, state } = useSidebar()
  const { data: authUser } = useAuth()
  const { data: conversations, isLoading } = useConversations()
  const createConversation = useCreateConversation()
  const router = useRouter()
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

  const handleCreateConversation = async () => {
    const result = await createConversation.mutateAsync(undefined)
    router.push(`/dashboard/sessions/${result.sessionId}`)
  }

  return (
    <>
      {state === 'collapsed' && (
        <div className="fixed left-2 top-3 z-50 hidden md:flex">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
      )}
      <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-1.5">
              <a href="/dashboard" className="flex items-center gap-2">
                <Image src="/logo.png" alt="Cosmic Engine" width={32} height={32} className="rounded" />
                <span className="text-base font-semibold">Cosmic Engine</span>
              </a>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleSidebar}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Conversations</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCreateConversation}
              disabled={createConversation.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[400px]">
              <SidebarMenu>
                {isLoading && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    Loading...
                  </div>
                )}
                {conversations?.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      asChild
                      className="cursor-pointer"
                    >
                      <a href={`/dashboard/sessions/${conversation.id}`} className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="truncate">
                          {conversation.title || 'Untitled Conversation'}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {!isLoading && conversations?.length === 0 && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {user && (
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      )}
    </Sidebar>
    </>
  )
}
