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
  const [newConversationTitle, setNewConversationTitle] = useState('');
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
      const result = await createConversation.mutateAsync(newConversationTitle || undefined);
      setNewConversationTitle('');
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
        <Card className='border-none'>
          <CardHeader>
            <CardTitle>New Conversation</CardTitle>
            <CardDescription>Start a new conversation</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Conversation title (optional)"
              value={newConversationTitle}
              onChange={(e) => setNewConversationTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateConversation()}
            />
            <Button onClick={handleCreateConversation} disabled={createConversation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='border-none'>
        <CardHeader>
          <CardTitle>Your Conversations</CardTitle>
          <CardDescription>
            {conversations?.length || 0} conversation{conversations?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="">
            <div className="space-y-2">
              {conversations?.map((conversation) => (
                <Card
                  key={conversation.id}
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors group"
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {editingConversationId === conversation.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(conversation.id);
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                className="h-8"
                                autoFocus
                                maxLength={100}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={(e) => handleSaveTitle(conversation.id, e)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <h3 className="font-medium truncate">
                              {conversation.title || 'Untitled Conversation'}
                            </h3>
                          )}
                          <p 
                            className="text-sm text-muted-foreground"
                            title={new Date(conversation.createdAt).toLocaleString('en-US', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          >
                            {new Date(conversation.createdAt).toLocaleDateString()} at{' '}
                            {new Date(conversation.createdAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                          {conversation.messages && conversation.messages.length > 0 && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {conversation.messages[0].content}
                            </p>
                          )}
                        </div>
                      </div>
                      {editingConversationId !== conversation.id && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleEditTitle(conversation.id, conversation.title || '', e)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            disabled={deleteConversation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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

      {/* Delete Confirmation Dialog */}
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
