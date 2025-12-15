'use client';

import {
  MessageSquare,
  Plus,
  PanelLeftClose,
  Loader2,
  CircleHelp,
} from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import BM25FileSelector from './BM25FileSelector';
import { ConversationItem } from './sidebar/ConversationItem';
import { SearchToggle } from './sidebar/SearchToggle';

import { NavUser } from '@/components/NavUser';
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
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useUpdateConversationTitle,
} from '@/hooks/use-conversations';
import { useSessionAttachments } from '@/hooks/use-upload';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSearchOptions } from '@/hooks/use-search-options';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import ReactMarkdown from 'react-markdown';

const HYBRID_SEARCH_HELP = `
### Hybrid Search
Combines semantic similarity **(vector search)** and keyword relevance **(BM25)**.

 • Vector search understands meaning  
 • BM25 boosts important terms  
 • Helps retrieve both precise and context-rich chunks  
`;

const RRF_SEARCH_HELP = `
Reciprocal Rank Fusion (RRF) is a simple, powerful scoring method used to combine results from multiple search systems: like BM25 + embeddings + hybrid models - into one ranked list.

RRF says: "If multiple systems rank a document highly, even if their scores differ, boost it heavily."

Instead of using raw scores (which may not be comparable), it uses rank positions only.
`;

const BM25_INDEXING_HELP = `
### BM25 Indexing

BM25 indexing extracts **keywords** and **term statistics** so the system can perform keyword-based searches.

 • Essential for Hybrid Search and RRF  
 • One-time processing per file  
 • Enables fast keyword matching  
`;

const KEYWORD_CACHING_HELP = `
### Keyword Caching

Stores recent query results to avoid redundant processing.

 • Faster responses for repeated queries  
 • Reduces LLM API calls  
 • Clears when session ends  
`;

const QUERY_EXPANSION_HELP = `
### Query Expansion

Expands short or vague queries with related terms before search.

 • Uses an LLM
 • Response time is increased

Recommended for short or ambiguous queries.
`;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar, state } = useSidebar();
  const { data: authUser } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateTitle = useUpdateConversationTitle();
  const router = useRouter();
  const pathname = usePathname();
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const {
    options,
    updateOptions,
    toggleHybridSearch,
    toggleRrfSearch,
    toggleKeywordCaching,
  } = useSearchOptions();
  const [showBM25Dialog, setShowBM25Dialog] = useState(false);
  const [isCheckingBM25, setIsCheckingBM25] = useState(false);
  const [isCheckingRRF, setIsCheckingRRF] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
  }>();

  const sessionId = pathname?.match(/\/dashboard\/sessions\/([^\/]+)/)?.[1];
  const { data: sessionAttachments } = useSessionAttachments(sessionId || '');

  useEffect(() => {
    if (authUser) {
      setUser({
        name: authUser.name || 'User',
        email: authUser.email,
        avatar: authUser.picture || '',
      });
    }
  }, [authUser]);

  const handleCreateConversation = async () => {
    const result = await createConversation.mutateAsync(undefined);
    router.push(`/dashboard/sessions/${result.sessionId}`);
  };

  const handleEditTitle = (conversationId: string, currentTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingConversationId(conversationId);
    setEditingTitle(currentTitle || '');
  };

  const handleSaveTitle = async (conversationId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!editingTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      await updateTitle.mutateAsync({ sessionId: conversationId, title: editingTitle.trim() });
      setEditingConversationId(null);
      setEditingTitle('');
      toast.success('Title updated successfully');
    } catch (error) {
      console.error('Failed to update title:', error);
      toast.error('Failed to update title. Please try again.');
    }
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      await deleteConversation.mutateAsync(conversationToDelete);
      toast.success('Conversation deleted successfully');
      if (sessionId === conversationToDelete) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleHybridSearchToggle = async (checked: boolean) => {
    if (checked) {
      setIsCheckingBM25(true);
      try {
        const allCompleted = sessionAttachments?.every(
          (att: any) => att.bm25indexStatus === 'completed'
        );
        const hasAnyFiles = sessionAttachments && sessionAttachments.length > 0;

        if (!hasAnyFiles || !allCompleted) {
          setShowBM25Dialog(true);
          setIsCheckingBM25(false);
          return;
        }

        toggleHybridSearch();
      } finally {
        setIsCheckingBM25(false);
      }
    } else {
      toggleHybridSearch();
    }
  };

  const handleRrfSearchToggle = async (checked: boolean) => {
    if (checked) {
      setIsCheckingRRF(true);
      try {
        const allCompleted = sessionAttachments?.every(
          (att: any) => att.bm25indexStatus === 'completed'
        );
        const hasAnyFiles = sessionAttachments && sessionAttachments.length > 0;

        if (!hasAnyFiles || !allCompleted) {
          setShowBM25Dialog(true);
          setIsCheckingRRF(false);
          return;
        }

        toggleRrfSearch();
      } finally {
        setIsCheckingRRF(false);
      }
    } else {
      toggleRrfSearch();
    }
  };

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
                  <Image
                    src="/logo.png"
                    alt="Cosmic Engine"
                    width={32}
                    height={32}
                    className="rounded"
                  />
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
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  defaultValue="search-strategies"
                >
                  <AccordionItem value="search-strategies" className="border-none">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <SidebarGroupLabel className="px-0">Search Strategies</SidebarGroupLabel>
                    </AccordionTrigger>

                    <AccordionContent className="pb-2 space-y-2">
                      <SearchToggle
                        id="hybrid-search"
                        label="Hybrid Search"
                        helpText={HYBRID_SEARCH_HELP}
                        checked={options.hybridSearch}
                        onCheckedChange={handleHybridSearchToggle}
                        isLoading={isCheckingBM25}
                      />

                      <SearchToggle
                        id="rrf-search"
                        label="Reciprocal Rank Fusion (RRF)"
                        helpText={RRF_SEARCH_HELP}
                        checked={options.rrfSearch}
                        onCheckedChange={handleRrfSearchToggle}
                        isLoading={isCheckingRRF}
                      />

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
                                <ReactMarkdown>{BM25_INDEXING_HELP}</ReactMarkdown>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>Keyword Caching</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SearchToggle
                    id="keyword-caching"
                    label="Enable Caching"
                    helpText={KEYWORD_CACHING_HELP}
                    checked={options.caching}
                    onCheckedChange={toggleKeywordCaching}
                  />
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="px-0">Vague Queries</SidebarGroupLabel>
                <SidebarGroupContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm cursor-pointer">Query Expansion</Label>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <CircleHelp className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer" />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="prose prose-invert text-sm whitespace-pre-wrap">
                            <ReactMarkdown>{QUERY_EXPANSION_HELP}</ReactMarkdown>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                    <Switch
                      checked={options.queryExpansion?.enabled ?? false}
                      onCheckedChange={(enabled) =>
                        updateOptions({
                          queryExpansion: enabled
                            ? {
                                enabled: true,
                                temperature: options.queryExpansion?.temperature ?? 0.5,
                              }
                            : undefined,
                        })
                      }
                    />
                  </div>

                  {options.queryExpansion?.enabled && (
                    <div className="px-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Temperature</span>
                        <span className="text-xs text-muted-foreground">
                          {(() => {
                            const t = options.queryExpansion.temperature;
                            if (t <= 0.3) return 'Conservative';
                            if (t <= 0.5) return 'Moderate';
                            if (t <= 0.7) return 'Aggressive';
                            return '🔥';
                          })()}
                        </span>
                      </div>
                      <Slider
                        className="hover:cursor-pointer"
                        min={0}
                        max={1}
                        step={0.01}
                        value={[options.queryExpansion.temperature]}
                        onValueChange={([v]) =>
                          updateOptions({
                            queryExpansion: {
                              enabled: true,
                              temperature: Number(v.toFixed(2)),
                            },
                          })
                        }
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {(options.queryExpansion?.temperature ?? 0.5).toFixed(2)}
                      </div>
                    </div>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </>
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
                      <div className="px-2 py-1 text-sm text-muted-foreground">Loading...</div>
                    )}
                    {conversations?.map((conversation) => (
                      <ConversationItem
                        key={conversation.id}
                        conversation={conversation}
                        isEditing={editingConversationId === conversation.id}
                        editingTitle={editingTitle}
                        onEditStart={handleEditTitle}
                        onEditSave={handleSaveTitle}
                        onEditCancel={handleCancelEdit}
                        onEditChange={setEditingTitle}
                        onDelete={handleDeleteConversation}
                        isDeleting={deleteConversation.isPending}
                      />
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
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
