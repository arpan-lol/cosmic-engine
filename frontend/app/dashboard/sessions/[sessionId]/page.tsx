'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation } from '@/hooks/use-conversations';
import { useStreamMessage } from '@/hooks/use-stream-message';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionAttachments, useDeleteAttachment, useBM25Progress } from '@/hooks/use-upload';
import { useSearchOptions } from '@/hooks/use-search-options';
import { useEngineEvents } from '@/hooks/use-engine-events';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import FileUploadButton from '@/components/FileUploadButton';
import AttachmentSelector from '@/components/AttachmentSelector';
import FilePanel from '@/components/FilePanel';
import { SystemMessage } from '@/components/SystemMessage';
import BM25ProgressCard from '@/components/BM25ProgressCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Message, EngineEvent } from '@/lib/types';
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

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const queryClient = useQueryClient();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [uploadedAttachments, setUploadedAttachments] = useState<string[]>([]);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`session-${sessionId}-selected-files`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [selectedPDF, setSelectedPDF] = useState<{ filename: string; url: string; targetPage?: number } | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  const { data: authUser } = useAuth();
  const { data: conversation, isLoading } = useConversation(sessionId);
  const { data: sessionAttachments, isLoading: isLoadingAttachments } = useSessionAttachments(sessionId);
  const { sendMessage, isStreaming, streamedContent, error, reset } = useStreamMessage();
  const deleteAttachment = useDeleteAttachment();
  const { options: searchOptions, disableHybridSearch } = useSearchOptions();
  const bm25Progress = useBM25Progress(sessionId, sessionAttachments);

  console.log('[SESSION] bm25Progress:', bm25Progress);
  console.log('[SESSION] sessionAttachments:', sessionAttachments);

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [engineEvents, setEngineEvents] = useState<EngineEvent[]>([]);
  const [flashTrigger, setFlashTrigger] = useState(0);

  const handleEngineEvent = useCallback((event: EngineEvent) => {
    if (event.scope === 'session') {
      setEngineEvents(prev => [...prev, event]);
    } else if (event.scope === 'user') {
      toast(event.message, {
        description: event.data?.title,
        duration: 10000,
      });
    }
  }, []);

  useEngineEvents({
    sessionId,
    onEvent: handleEngineEvent,
    onError: (error) => {
      console.error('[EngineEvents] Connection error:', error);
    },
  });

  useEffect(() => {
    if (conversation?.messages) {
      const regularMessages: Message[] = [];
      const systemEvents: EngineEvent[] = [];

      conversation.messages.forEach(msg => {
        if (msg.role === 'system') {
          try {
            const event = JSON.parse(msg.content) as EngineEvent;
            systemEvents.push(event);
          } catch (error) {
            console.error('[Session] Failed to parse system message:', error);
          }
        } else {
          regularMessages.push(msg);
        }
      });

      setOptimisticMessages(regularMessages);
      setEngineEvents(systemEvents);
    }
  }, [conversation?.messages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [optimisticMessages, streamedContent]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`session-${sessionId}-selected-files`, JSON.stringify(selectedContextIds));
    }
  }, [selectedContextIds, sessionId]);

  useEffect(() => {
    if (sessionAttachments && typeof window !== 'undefined') {
      const validIds = selectedContextIds.filter((id: string) => 
        sessionAttachments.some((att: any) => att.id === id)
      );
      if (validIds.length !== selectedContextIds.length) {
        setSelectedContextIds(validIds);
      }
    }
  }, [sessionAttachments]);

  useEffect(() => {
    
    if (!sessionAttachments || uploadedAttachments.length === 0) {
      return;
    }

    const processedUploads = sessionAttachments
      .filter((att: any) => {
        const isInUploadedList = uploadedAttachments.includes(att.id);
        const isProcessed = att.metadata?.processed === true;
        return isInUploadedList && isProcessed;
      })
      .map((att: any) => att.id);


    if (processedUploads.length > 0) {
      setSelectedContextIds(prev => {
        const newIds = processedUploads.filter((id: string) => !prev.includes(id));
        return newIds.length > 0 ? [...prev, ...newIds] : prev;
      });
      
      setUploadedAttachments(prev => {
        const updated = prev.filter((id: string) => !processedUploads.includes(id));
        return updated;
      });

      setFlashTrigger(prev => prev + 1);
    }
  }, [sessionAttachments, uploadedAttachments]);

  const handleSendMessage = async (content: string) => {
    const userMsg: Message = {
      id: `temp-user-${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      attachments: sessionAttachments?.filter((att: any) =>
        selectedContextIds.includes(att.id)
      ) || [],
    };

    const assistantMsg: Message = {
      id: `temp-assistant-${Date.now()}`,
      sessionId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setOptimisticMessages(prev => [...prev, userMsg, assistantMsg]);

    console.log('[SESSION] searchOptions.hybridSearch =', searchOptions.hybridSearch);
    console.log('[SESSION] Sending message with bm25 =', searchOptions.hybridSearch);

    await sendMessage(sessionId, content, {
      attachmentIds: selectedContextIds.length > 0 ? selectedContextIds : undefined,
      bm25: searchOptions.hybridSearch,
      onComplete: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations', sessionId] });
        setTimeout(() => reset(), 100);
      },
      onError: (error) => {
        console.error('Error sending message:', error);
      },
    });
  };


  const handleUploadComplete = (attachmentId: string) => {
    console.log('[UPLOAD] Upload complete for attachment:', attachmentId);
    
    if (searchOptions.hybridSearch) {
      console.log('[UPLOAD] Disabling hybrid search due to new file upload');
      disableHybridSearch();
      
      toast.info('Hybrid Search disabled', {
        description: 'New files need BM25 indexing before using hybrid search',
        duration: 5000,
      });
    }
    
    setUploadedAttachments((prev) => {
      const updated = [...prev, attachmentId];
      console.log('[UPLOAD] Updated uploadedAttachments:', updated);
      return updated;
    });
    
    // Force immediate refetch by invalidating with refetchType: 'active'
    queryClient.invalidateQueries({ 
      queryKey: ['sessions', sessionId, 'attachments'],
      refetchType: 'active'
    });
  };

  const handleCitationClick = (filename: string, page?: number) => {
    const attachment = sessionAttachments?.find((att: any) => att.filename === filename);
    if (attachment && attachment.filename.toLowerCase().endsWith('.pdf')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
      const fileToUse = attachment.storedFilename || attachment.filename;
      setSelectedPDF({
        filename: attachment.filename,
        url: `${baseUrl}/dashboard/sessions/uploads/${encodeURIComponent(fileToUse)}`,
        targetPage: page,
      });
    }
  };

  const handleDocumentClick = (attachment: any) => {
    if (!attachment.filename.toLowerCase().endsWith('.pdf')) {
      return;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    const fileToUse = attachment.storedFilename || attachment.filename;
    setSelectedPDF({
      filename: attachment.filename,
      url: `${baseUrl}/dashboard/sessions/uploads/${encodeURIComponent(fileToUse)}`,
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachmentToDelete(attachmentId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    try {
      await deleteAttachment.mutateAsync(attachmentToDelete);
      
      if (selectedPDF) {
        const deletedAttachment = sessionAttachments?.find((att: any) => att.id === attachmentToDelete);
        if (deletedAttachment && selectedPDF.url.includes(deletedAttachment.storedFilename || deletedAttachment.filename)) {
          setSelectedPDF(undefined);
        }
      }

      setSelectedContextIds(prev => prev.filter(id => id !== attachmentToDelete));
      setUploadedAttachments(prev => prev.filter(id => id !== attachmentToDelete));
      
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId, 'attachments'] });
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast.error('Failed to delete file. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Conversation not found</p>
            <Button onClick={() => router.push('/dashboard/sessions')} className="mt-4">
              Back to Conversations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  type TimelineItem = 
    | { type: 'message'; data: Message }
    | { type: 'event'; data: EngineEvent };

  const displayMessages = [...optimisticMessages];

  if (isStreaming && streamedContent) {
    const lastMessage = displayMessages[displayMessages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      displayMessages[displayMessages.length - 1] = {
        ...lastMessage,
        content: streamedContent,
      };
    }
  }

  const timeline: TimelineItem[] = [
    ...displayMessages.map(msg => ({ type: 'message' as const, data: msg })),
    ...engineEvents.map(evt => ({ type: 'event' as const, data: evt })),
  ].sort((a, b) => {
    const timeA = a.type === 'message' ? a.data.createdAt : a.data.timestamp;
    const timeB = b.type === 'message' ? b.data.createdAt : b.data.timestamp;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  const isLoadingResponse = isStreaming && !streamedContent;
  
  // Check if any attachments are currently being processed
  const hasProcessingAttachments = sessionAttachments?.some(
    (att: any) => !att.metadata?.processed && !att.metadata?.error
  ) || false;

  // Check if any attachments are currently being BM25 indexed
  const hasBM25Indexing = sessionAttachments?.some(
    (att: any) => att.bm25indexStatus === 'queued' || att.bm25indexStatus === 'processing'
  ) || false;
  
  if (isStreaming && streamedContent && displayMessages.length > 0) {
    const lastMessage = displayMessages[displayMessages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      displayMessages[displayMessages.length - 1] = {
        ...lastMessage,
        content: streamedContent,
      };
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat Section */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Card className="border-0 border-b p-0 bg-background flex-shrink-0 rounded-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/sessions')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  <CardTitle className="truncate">{conversation.title || 'Untitled Conversation'}</CardTitle>
                  <p 
                    className="text-sm text-muted-foreground truncate"
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
                    Created {new Date(conversation.createdAt).toLocaleDateString()} at {new Date(conversation.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
              <AttachmentSelector
                sessionId={sessionId}
                attachments={sessionAttachments || []}
                selectedIds={selectedContextIds}
                onSelectionChange={(ids) => setSelectedContextIds(ids)}
                isLoading={isLoadingAttachments}
                flashTrigger={flashTrigger}
              />
            </div>
          </CardHeader>
        </Card>

        <div className="flex-1 overflow-y-auto min-h-0 bg-background" ref={scrollAreaRef}>
        <div className="p-4">
          {timeline.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Start a conversation by sending a message
            </div>
          ) : (
            <div>
              {timeline.map((item, index) => {
                if (item.type === 'message') {
                  const isLastAssistantMessage = 
                    index === timeline.length - 1 && 
                    item.data.role === 'assistant';
                  
                  return (
                    <ChatMessage 
                      key={item.data.id} 
                      message={item.data} 
                      userAvatar={authUser?.picture}
                      userName={authUser?.name}
                      isLoading={isLoadingResponse && isLastAssistantMessage}
                      onCitationClick={handleCitationClick}
                    />
                  );
                } else {
                  return (
                    <SystemMessage 
                      key={item.data.timestamp} 
                      event={item.data} 
                    />
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>

      <Card className="mt-0 bg-background flex-shrink-0 border-0 border-t rounded-none">
        <CardContent className="p-2 space-y-2">{error && (
            <Card className="border-destructive">
              <CardContent className="p-3 text-sm text-destructive flex items-start justify-between gap-2">
                <span>Error! The server might be overloaded. Please try again.</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 -mt-0.5 hover:bg-destructive/10"
                  onClick={() => reset()}
                >
                  <span className="sr-only">Dismiss error</span>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="w-full">
            <FileUploadButton sessionId={sessionId} onUploadComplete={handleUploadComplete} />
          </div>

          {sessionAttachments && Object.entries(bm25Progress).map(([attachmentId, progressData]) => {
            console.log('[BM25 RENDER] Rendering progress for:', attachmentId, progressData);
            const attachment = sessionAttachments.find((att: any) => att.id === attachmentId);
            if (!attachment) {
              console.log('[BM25 RENDER] No attachment found for:', attachmentId);
              return null;
            }
            
            console.log('[BM25 RENDER] Rendering BM25ProgressCard for:', attachment.filename);
            return (
              <BM25ProgressCard
                key={attachmentId}
                attachmentId={attachmentId}
                filename={attachment.filename}
                progressData={progressData}
              />
            );
          })}

          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming || isLoadingAttachments || hasProcessingAttachments || hasBM25Indexing}
            loading={isLoadingAttachments}
            placeholder={
              isStreaming
                ? 'Waiting for response...'
                : isLoadingAttachments
                ? 'Loading...'
                : hasProcessingAttachments
                ? 'Processing documents...'
                : hasBM25Indexing
                ? 'Indexing files for BM25...'
                : 'Type your message... (Enter to send, Shift+Enter for new line)'
            }
          />
        </CardContent>
      </Card>
      </div>

      {/* File Panel Section */}
      <div className="w-[500px] flex-shrink-0 h-full overflow-hidden">
        <FilePanel
          attachments={sessionAttachments || []}
          selectedFile={selectedPDF}
          onClose={() => setSelectedPDF(undefined)}
          onDocumentClick={handleDocumentClick}
          onDeleteAttachment={handleDeleteAttachment}
          bm25Progress={bm25Progress}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAttachment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
