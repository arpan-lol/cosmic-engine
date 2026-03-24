'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConversations, useCreateConversation, useDeleteConversation, useUpdateConversationTitle } from '@/hooks/use-conversations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, MessageSquare, Loader2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatMessageDateTime, formatRelativeDateTime } from '@/lib/date-utils';
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

export default function SessionList() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const { data: conversations, isLoading } = useConversations();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const updateTitle = useUpdateConversationTitle();

  const handleCreateConversation = async () => {
    try {
      const result = await createConversation.mutateAsync(undefined);
      if (result?.sessionId) {
        router.push(`/dashboard/sessions/${result.sessionId}`);
      } else {
        console.error('Session creation failed: No sessionId returned', result);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleEditTitle = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConversationId(sessionId);
    setEditingTitle(currentTitle || '');
  };

  const handleSaveTitle = async (sessionId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!editingTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      await updateTitle.mutateAsync({ sessionId, title: editingTitle.trim() });
      setEditingConversationId(null);
      setEditingTitle('');
      toast.success('Title updated successfully');
    } catch (error) {
      console.error('Failed to update title:', error);
      toast.error('Failed to update title. Please try again.');
    }
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleDeleteConversation = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      await deleteConversation.mutateAsync(conversationToDelete);
      toast.success('Conversation deleted successfully');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleSelectConversation = (sessionId: string) => {
    router.push(`/dashboard/sessions/${sessionId}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Your Conversations</CardTitle>
            <CardDescription>
              {conversations?.length || 0} conversation{conversations?.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button
            size="icon"
            className="h-11 w-11 rounded-2xl border border-primary/15 bg-primary/95 text-primary-foreground shadow-sm"
            onClick={handleCreateConversation}
            disabled={createConversation.isPending}
            aria-label="Create conversation"
          >
            {createConversation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="">
            <div className="border-t border-border/60">
              {conversations?.map((conversation) => (
                <div
                  key={conversation.id}
                  className="group cursor-pointer border-b border-border/60 transition-colors last:border-b-0 hover:bg-muted/50"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingConversationId === conversation.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle(conversation.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="h-9"
                              autoFocus
                              maxLength={100}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 flex-shrink-0 rounded-full border border-border/60 bg-background"
                              onClick={(e) => handleSaveTitle(conversation.id, e)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 flex-shrink-0 rounded-full border border-border/60 bg-background"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate font-medium">
                                  {conversation.title || 'Untitled Conversation'}
                                </h3>
                                <p
                                  className="mt-1 text-sm text-muted-foreground"
                                  title={formatMessageDateTime(conversation.updatedAt || conversation.createdAt)}
                                >
                                  {formatRelativeDateTime(conversation.updatedAt || conversation.createdAt)}
                                </p>
                              </div>
                              <div className="flex flex-shrink-0 items-center gap-1 opacity-100 transition-all sm:translate-x-1 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-x-0 sm:group-focus-within:opacity-100">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full border border-transparent bg-background/80 text-muted-foreground shadow-sm hover:border-border/80 hover:bg-background hover:text-foreground"
                                  onClick={(e) => handleEditTitle(conversation.id, conversation.title || '', e)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full border border-transparent bg-background/80 text-muted-foreground shadow-sm hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                                  disabled={deleteConversation.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {conversation.messages && conversation.messages.length > 0 && (
                              <p className="mt-2 truncate text-sm text-muted-foreground">
                                {conversation.messages[0].content}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {conversations?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>No conversations yet</p>
                  <p>Create one to get started!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

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
    </div>
  );
}
