'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation } from '@/hooks/use-conversations';
import { useStreamMessage } from '@/hooks/use-stream-message';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionAttachments, useDeleteAttachment, useBM25Progress, useUploadFile } from '@/hooks/use-upload';
import { useSearchOptions } from '@/hooks/use-search-options';
import { useEngineEvents } from '@/hooks/use-engine-events';
import ChatMessage from '@/components/ChatMessage';
import ChatComposer from '@/components/ChatComposer';
import AttachmentSelector from '@/components/AttachmentSelector';
import FilePanel from '@/components/FilePanel';
import BM25ProgressCard from '@/components/BM25ProgressCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const { sendMessage, isStreaming, isComplete, streamedContent, error, reset } = useStreamMessage();
  const deleteAttachment = useDeleteAttachment();
  const { options: searchOptions, disableHybridSearch } = useSearchOptions();
  const bm25Progress = useBM25Progress(sessionId, sessionAttachments);
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('[SESSION] bm25Progress:', bm25Progress);
  console.log('[SESSION] sessionAttachments:', sessionAttachments);

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [allLogs, setAllLogs] = useState<EngineEvent[]>([]);
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [displayTitle, setDisplayTitle] = useState('');
  const [isTypingTitle, setIsTypingTitle] = useState(false);

  const handleEngineEvent = useCallback((event: EngineEvent) => {
    if (event.type === 'title-update' && event.newTitle) {
      setIsTypingTitle(true);
      let currentIndex = 0;
      const targetTitle = event.newTitle;
      
      const typeInterval = setInterval(() => {
        currentIndex++;
        setDisplayTitle(targetTitle.slice(0, currentIndex));
        
        if (currentIndex >= targetTitle.length) {
          clearInterval(typeInterval);
          setIsTypingTitle(false);
          queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      }, 50);
      
      return;
    }

    if (event.scope === 'session') {
      setAllLogs(prev => [...prev, event]);
    } else if (event.scope === 'user') {
      toast(event.message, {
        description: event.data?.title,
        duration: 10000,
      });
    }
  }, [sessionId, queryClient]);

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
      const logs: EngineEvent[] = [];

      conversation.messages.forEach(msg => {
        if (msg.role === 'system') {
          try {
            const event = JSON.parse(msg.content) as EngineEvent;
            logs.push(event);
          } catch (error) {
            console.error('[Session] Failed to parse system message:', error);
          }
        } else {
          console.debug('[Session] Processing message:', {
            messageId: msg.id,
            role: msg.role,
            hasAttachments: !!msg.attachments,
            attachmentCount: msg.attachments?.length || 0,
            attachments: msg.attachments,
          });
          regularMessages.push(msg);
        }
      });

      setOptimisticMessages(regularMessages);
      setAllLogs(logs);
    }
  }, [conversation?.messages]);

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
  }, [sessionAttachments, selectedContextIds]);

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

    await sendMessage(sessionId, content, {
      attachmentIds: selectedContextIds.length > 0 ? selectedContextIds : undefined,
      bm25: searchOptions.hybridSearch,
      rrf: searchOptions.rrfSearch,
      caching: searchOptions.caching,
      queryExpansion: searchOptions.queryExpansion,
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

  const handleAttachmentClick = (filename: string) => {
    handleCitationClick(filename);
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

  const displayMessages = useMemo(() => {
    const messages = [...optimisticMessages];
    if (isStreaming && streamedContent) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        messages[messages.length - 1] = { ...lastMsg, content: streamedContent };
      }
    }
    return messages;
  }, [optimisticMessages, isStreaming, streamedContent]);

  const isLoadingResponse = isStreaming && !streamedContent;
  
  const hasProcessingAttachments = sessionAttachments?.some(
    (att: any) => !att.metadata?.processed && !att.metadata?.error
  ) || false;

  const hasBM25Indexing = sessionAttachments?.some(
    (att: any) => att.bm25indexStatus === 'queued' || att.bm25indexStatus === 'processing'
  ) || false;

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
                  <CardTitle className="truncate">
                    {isTypingTitle ? displayTitle : (conversation.title || 'Untitled Conversation')}
                    {isTypingTitle && <span className="animate-pulse">|</span>}
                  </CardTitle>
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

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full bg-background">
            <div className="p-4">
            {displayMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Start a conversation by sending a message
              </div>
            ) : (
              <div>
                {displayMessages.map((message, index) => {
                  const isLastAssistantMessage = 
                    index === displayMessages.length - 1 && 
                    message.role === 'assistant';
                  
                  return (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                      userAvatar={authUser?.picture}
                      userName={authUser?.name}
                      isLoading={isLoadingResponse && isLastAssistantMessage}
                      isStreaming={isStreaming && isLastAssistantMessage}
                      isComplete={isComplete}
                      onCitationClick={handleCitationClick}
                      onAttachmentClick={handleAttachmentClick}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
        </div>

      <div className="flex-shrink-0 space-y-2 p-2">
        {error && (
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

        <input
          ref={fileInputRef}
          type="file"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            const maxSize = 50 * 1024 * 1024;
            
            for (const file of files) {
              if (file.size > maxSize) {
                toast.error(`${file.name} exceeds 50MB limit`, {
                  description: 'Please upload a smaller file!',
                  duration: 6000,
                });
                continue;
              }

              try {
                const result = await uploadFile.mutateAsync({ file, sessionId });
                handleUploadComplete(result.attachmentId);
              } catch (error) {
                console.error('Upload failed:', error);
                const errorMessage = error instanceof Error ? error.message : 'Upload failed';
                
                if (errorMessage.includes('413') || errorMessage.includes('size') || errorMessage.includes('limit')) {
                  toast.error(`${file.name} too large`, {
                    description: 'The file exceeds server upload limits.',
                    duration: 8000,
                  });
                } else if (errorMessage.includes('CORS') || errorMessage.includes('fetch')) {
                  toast.error(`Upload failed: ${file.name}`, {
                    description: 'Network error. Please try again.',
                    duration: 6000,
                  });
                } else {
                  toast.error(`Upload failed: ${file.name}`, {
                    description: errorMessage,
                    duration: 6000,
                  });
                }
              }
            }

            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          className="hidden"
          accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          multiple
        />

        <ChatComposer
          onSend={handleSendMessage}
          onAttachmentClick={() => fileInputRef.current?.click()}
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
              : 'Ask Anything'
          }
        />
      </div>
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
          logs={allLogs}
          sessionId={sessionId}
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
