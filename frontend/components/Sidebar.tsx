'use client'

import {
  HelpCircle,
  List,
  Settings,
  MessageSquare,
  Plus,
  PanelLeftClose,
  Loader2,
  CircleHelp,
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import ReactMarkdown from 'react-markdown'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar, state } = useSidebar()
  const { data: authUser } = useAuth()
  const { data: conversations, isLoading } = useConversations()
  const createConversation = useCreateConversation()
  const router = useRouter()
  const pathname = usePathname()
  const { options, toggleHybridSearch, toggleRrfSearch, toggleKeywordCaching } = useSearchOptions()
  const [showBM25Dialog, setShowBM25Dialog] = useState(false)
  const [isCheckingBM25, setIsCheckingBM25] = useState(false)
  const [isCheckingRRF, setIsCheckingRRF] = useState(false)
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

  const handleHybridSearchToggle = async (checked: boolean) => {
    if (checked) {
      setIsCheckingBM25(true)
      try {
        const allCompleted =
          sessionAttachments?.every((att: any) => att.bm25indexStatus === 'completed')
        const hasAnyFiles = sessionAttachments && sessionAttachments.length > 0

        if (!hasAnyFiles || !allCompleted) {
          setShowBM25Dialog(true)
          setIsCheckingBM25(false)
          return
        }

        toggleHybridSearch()
      } finally {
        setIsCheckingBM25(false)
      }
    } else {
      toggleHybridSearch()
    }
  }

  const handleRrfSearchToggle = async (checked: boolean) => {
    if (checked) {
      setIsCheckingRRF(true)
      try {
        const allCompleted =
          sessionAttachments?.every((att: any) => att.bm25indexStatus === 'completed')
        const hasAnyFiles = sessionAttachments && sessionAttachments.length > 0

        if (!hasAnyFiles || !allCompleted) {
          setShowBM25Dialog(true)
          setIsCheckingRRF(false)
          return
        }

        toggleRrfSearch()
      } finally {
        setIsCheckingRRF(false)
      }
    } else {
      toggleRrfSearch()
    }
  }

  return (
    <>
      {state === 'collapsed' && (
        <div className="fixed left-2 top-3 z-50 hidden md:flex">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
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
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleSidebar}>
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {sessionId && (
            <>
              <SidebarGroup>
                <Accordion type="single" collapsible className="w-full" defaultValue="search-strategies">
                  <AccordionItem value="search-strategies" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <SidebarGroupLabel className="px-0">Search Strategies</SidebarGroupLabel>
                    </AccordionTrigger>

                    <AccordionContent className="pb-2 space-y-2">

                      {/* HYBRID SEARCH */}
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="hybrid-search" className="text-sm cursor-pointer">
                            Hybrid Search
                          </Label>

                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <CircleHelp className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="prose prose-invert text-sm">
                              <div className="prose prose-invert text-sm whitespace-pre-wrap">
                                <ReactMarkdown>
                                  {`
### Hybrid Search
Combines semantic similarity **(vector search)** and keyword relevance **(BM25)**.

 • Vector search understands meaning  
 • BM25 boosts important terms  
 • Helps retrieve both precise and context-rich chunks  
`}
                                </ReactMarkdown>
                              </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>

                        {isCheckingBM25 ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch
                            id="hybrid-search"
                            checked={options.hybridSearch}
                            onCheckedChange={handleHybridSearchToggle}
                          />
                        )}
                      </div>

                      {/* RRF */}

                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="rrf-search" className="text-sm cursor-pointer">
                            Reciprocal Rank Fusion (RRF)
                          </Label>

                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <CircleHelp className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="prose prose-invert text-sm whitespace-pre-wrap">
                                <ReactMarkdown>
                                  {`
 Reciprocal Rank Fusion (RRF) is a simple, powerful scoring method used to combine results from multiple search systems: like BM25 + embeddings + hybrid models - into one ranked list. 
 
 RRF says: "If multiple systems rank a document highly, even if their scores differ, boost it heavily." 
 
 Instead of using raw scores (which may not be comparable), it uses rank positions only.
  `}
                                </ReactMarkdown>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>

                        {isCheckingRRF ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Switch
                            id="rrf-search"
                            checked={options.rrfSearch}
                            onCheckedChange={handleRrfSearchToggle}
                          />
                        )}
                      </div>


                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center justify-between h-11"
                          onClick={() => setShowBM25Dialog(true)}
                        >
                          <span>Index Files for BM25</span>

                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <span
                                className="ml-3 flex items-center justify-center h-5 w-5 rounded-full hover:bg-muted/20"
                                aria-hidden
                              >
                                <CircleHelp
                                  size={14}
                                  className="text-muted-foreground hover:text-primary cursor-help"
                                />
                              </span>
                            </HoverCardTrigger>
   <HoverCardContent className="w-80">
                              <div className="prose prose-invert text-sm whitespace-pre-wrap">
                                <ReactMarkdown>
                                  {`
### BM25 Indexing

BM25 indexing extracts **keywords** and **term statistics** so the system can

 • Score chunks by keyword relevance (unlike vector, which is semantic) 
 • Boost terms that appear more
 • Combine keyword signals with semantic search  

Before Hybrid Search or RRF can run, each file must be indexed with BM25.
`}
                                </ReactMarkdown>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </Button>
                      </div>


                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </SidebarGroup>

              {/* Cache Section */}
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center justify-between px-0">
                  <span>Cache</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="flex items-center justify-between py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="keyword-caching" className="text-sm cursor-pointer">
                        Keyword Caching
                      </Label>

                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <CircleHelp className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="prose prose-invert text-sm whitespace-pre-wrap">
                            <ReactMarkdown>
                              {`
### Keyword Caching

Caches Query, options and the generated response.

 • Reduces computation time for repeated queries
 • Speeds up search response times
`}
                            </ReactMarkdown>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>

                    <Switch
                      id="keyword-caching"
                      checked={options.caching}
                      onCheckedChange={toggleKeywordCaching}
                    />
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}

          {/* Conversations Section */}
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
                    <div className="px-2 py-1 text-sm text-muted-foreground">Loading...</div>
                  )}
                  {conversations?.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton asChild className="cursor-pointer">
                        <a href={`/dashboard/sessions/${conversation.id}`} className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="truncate">{conversation.title || 'Untitled Conversation'}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {!isLoading && conversations?.length === 0 && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">No conversations yet</div>
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
        />
      )}
    </>
  )
}