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
import { useRouter, usePathname } from 'next/navigation'
import BM25FileSelector from './BM25FileSelector'

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
import { useSessionAttachments } from '@/hooks/use-upload'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSearchOptions } from '@/hooks/use-search-options'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

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
  const pathname = usePathname()
  const { options, toggleHybridSearch } = useSearchOptions()
  const [showBM25Dialog, setShowBM25Dialog] = useState(false)
  const [user, setUser] = useState<{
    name: string
    email: string
    avatar: string
  }>()

  const sessionId = pathname?.match(/\/dashboard\/sessions\/([^\/]+)/)?.[1]
  const { data: sessionAttachments } = useSessionAttachments(sessionId || '')

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

  const handleHybridSearchToggle = (checked: boolean) => {
    if (checked) {
      setShowBM25Dialog(true)
    }
    toggleHybridSearch()
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
        {sessionId && (
          <SidebarGroup>
            <Accordion type="single" collapsible className="w-full" defaultValue="search-strategies">
              <AccordionItem value="search-strategies" className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <SidebarGroupLabel className="px-0">Search Strategies</SidebarGroupLabel>
                </AccordionTrigger>
                <AccordionContent className="pb-2 space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <Label htmlFor="hybrid-search" className="text-sm cursor-pointer">
                      Hybrid Search
                    </Label>
                    <Switch
                      id="hybrid-search"
                      checked={options.hybridSearch}
                      onCheckedChange={handleHybridSearchToggle}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowBM25Dialog(true)}
                  >
                    Index Files for BM25
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-0">
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
    {sessionId && sessionAttachments && (
      <BM25FileSelector
        sessionId={sessionId}
        attachments={sessionAttachments}
        open={showBM25Dialog}
        onOpenChange={setShowBM25Dialog}
        onIndexingStarted={() => {
          console.log('BM25 indexing started');
        }}
      />
    )}
    </>
  )
}
