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
import { useFileViewer } from '@/contexts/FileViewerContext';
import ChatMessage from '@/components/ChatMessage';
import ChatComposer from '@/components/ChatComposer';
import AttachmentSelector from '@/components/AttachmentSelector';
import FilePanel from '@/components/FilePanel';
import BM25ProgressCard from '@/components/BM25ProgressCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import type { Message, EngineEvent, StreamStatus } from '@/lib/types';
import { toast } from 'sonner';

interface TemporaryFile {
  id: string;
  realId?: string;
  filename: string;
  type: string;
  size: number;
  isTemporary: true;
  uploadProgress?: number;
  processingProgress?: StreamStatus;
}
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
  const [temporaryFiles, setTemporaryFiles] = useState<Map<string, TemporaryFile>>(new Map());
  const activeStreamsRef = useRef<Set<string>>(new Set());
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());

  const connectToFileProgressStream = useCallback(async (attachmentId: string, filename: string) => {
    if (activeStreamsRef.current.has(attachmentId)) {
      console.log('[SSE] Already connected to:', attachmentId);
      return;
    }

    console.log('[SSE] Connecting to stream for:', attachmentId, filename);
    activeStreamsRef.current.add(attachmentId);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    
    let token: string | null = null;
    try {
      const tokenResponse = await fetch('/api/auth/token');
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        token = tokenData.token;
      }
    } catch (error) {
      console.error('[File Progress] Failed to get token:', error);
    }
    
    const url = new URL(`${API_BASE_URL}/chat/attachments/${attachmentId}/stream`);
    if (token) {
      url.searchParams.set('token', token);
    }
    
    const eventSource = new EventSource(url.toString(), { withCredentials: true });
    eventSourcesRef.current.set(attachmentId, eventSource);
    
    console.log('[SSE] EventSource created:', { attachmentId, url: url.toString() });
    
    eventSource.onopen = () => {
      console.log('[SSE] Connection opened for:', attachmentId);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: StreamStatus = JSON.parse(event.data);
        console.log('[SSE] Received file processing progress:', { attachmentId, data });
        
        if (!data.phase || data.phase === 'file-processing') {
          setTemporaryFiles(prev => {
            let foundKey: string | null = null;
            let foundFile: TemporaryFile | null = null;
            
            for (const [key, file] of prev.entries()) {
              if (file.realId === attachmentId || file.id === attachmentId) {
                foundKey = key;
                foundFile = file;
                break;
              }
            }
            
            if (!foundFile || !foundKey) {
              console.log('[SSE] No temp file found for:', attachmentId);
              return prev;
            }
            
            const newMap = new Map(prev);
            newMap.set(foundKey, {
              ...foundFile,
              processingProgress: data,
            });
            return newMap;
          });
        }

        if (data.status === 'completed' || data.status === 'error') {
          eventSource.close();
          eventSourcesRef.current.delete(attachmentId);
          activeStreamsRef.current.delete(attachmentId);
          queryClient.invalidateQueries({ 
            queryKey: ['sessions', sessionId, 'attachments'],
            refetchType: 'active'
          });
        }
      } catch (error) {
        console.error('[File Progress] Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error for:', attachmentId, error);
      eventSource.close();
      eventSourcesRef.current.delete(attachmentId);
      activeStreamsRef.current.delete(attachmentId);
    };
  }, [sessionId, queryClient]);
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`session-${sessionId}-selected-files`);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [selectedPDF, setSelectedPDF] = useState<{ filename: string; url: string; targetPage?: number; type?: string } | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);

  const { setIsFileViewerOpen } = useFileViewer();

  useEffect(() => {
    setIsFileViewerOpen(!!selectedPDF);
  }, [selectedPDF, setIsFileViewerOpen]);

  const { data: authUser } = useAuth();
  const { data: conversation, isLoading } = useConversation(sessionId);
  const { data: sessionAttachments, isLoading: isLoadingAttachments } = useSessionAttachments(sessionId);
  const { sendMessage, isStreaming, isComplete, streamedContent, error, reset } = useStreamMessage();
  const deleteAttachment = useDeleteAttachment();
  const { options: searchOptions, disableHybridSearch } = useSearchOptions();
  const bm25Progress = useBM25Progress(sessionId, sessionAttachments);
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const mergedAttachments = useMemo(() => {
    const real = sessionAttachments || [];
    const temp = Array.from(temporaryFiles.values());
    
    const processedRealIds = new Set(
      real
        .filter((att: any) => att.metadata?.processed === true)
        .map((att: any) => att.id)
    );
    const uniqueTemp = temp.filter(t => !processedRealIds.has(t.realId || t.id));
    
    const tempRealIds = new Set(temp.map(t => t.realId).filter(Boolean));
    const unprocessedReal = real.filter((att: any) => !tempRealIds.has(att.id));
    
    const merged = [...uniqueTemp, ...unprocessedReal];
    
    if (temp.length > 0) {
      console.log('[Session] mergedAttachments:', { 
        tempCount: temp.length, 
        uniqueTempCount: uniqueTemp.length,
        realCount: real.length,
        processedRealCount: processedRealIds.size,
        unprocessedRealCount: unprocessedReal.length,
        mergedCount: merged.length,
        tempFiles: temp.map(t => ({ id: t.id, filename: t.filename, isTemporary: t.isTemporary })),
        merged: merged.map((a: any) => ({ id: a.id, filename: a.filename, isTemporary: a.isTemporary, processed: a.metadata?.processed }))
      });
    }
    
    return merged;
  }, [sessionAttachments, temporaryFiles]);

  const fileProcessingProgress = useMemo(() => {
    const progressMap: Record<string, StreamStatus> = {};
    
    for (const [id, tempFile] of temporaryFiles.entries()) {
      if (tempFile.processingProgress) {
        progressMap[id] = tempFile.processingProgress;
        
        if (tempFile.realId) {
          progressMap[tempFile.realId] = tempFile.processingProgress;
        }
      }
    }
    
    if (Object.keys(progressMap).length > 0) {
      console.log('[Session] fileProcessingProgress:', progressMap);
    }
    
    return progressMap;
  }, [temporaryFiles]);

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [allLogs, setAllLogs] = useState<EngineEvent[]>([]);
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [displayTitle, setDisplayTitle] = useState('');
  const [isTypingTitle, setIsTypingTitle] = useState(false);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());

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

  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleEngineEvent = useCallback((event: EngineEvent) => {
    if (event.type === 'title-update' && event.newTitle) {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
      setIsTypingTitle(true);
      let currentIndex = 0;
      const targetTitle = event.newTitle;
      
      titleIntervalRef.current = setInterval(() => {
        currentIndex++;
        setDisplayTitle(targetTitle.slice(0, currentIndex));
        
        if (currentIndex >= targetTitle.length) {
          if (titleIntervalRef.current) {
            clearInterval(titleIntervalRef.current);
            titleIntervalRef.current = null;
          }
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
    return () => {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isStreaming || displayMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [streamedContent, displayMessages.length, isStreaming]);

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

      const serverMessageCount = regularMessages.length;
      const currentMessageCount = optimisticMessages.length;
      
      if (serverMessageCount >= currentMessageCount) {
        setOptimisticMessages(regularMessages);
        setSeenMessageIds(new Set(regularMessages.map(m => m.id)));
        if (isComplete && serverMessageCount > currentMessageCount) {
          reset();
        }
      }
      setAllLogs(logs);
    }
  }, [conversation?.messages, isStreaming, isComplete, optimisticMessages.length, reset]);

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

  useEffect(() => {
    if (!sessionAttachments) return;
    
    setTemporaryFiles(prev => {
      const newMap = new Map(prev);
      let hasChanges = false;
      
      for (const [tempId, tempFile] of prev.entries()) {
        const realId = tempFile.realId || tempId;
        const existsInDB = sessionAttachments.some((att: any) => att.id === realId);
        const isProcessed = sessionAttachments.find((att: any) => att.id === realId)?.metadata?.processed;
        
        if (existsInDB && isProcessed) {
          newMap.delete(tempId);
          hasChanges = true;
        }
      }
      
      return hasChanges ? newMap : prev;
    });
  }, [sessionAttachments]);

  useEffect(() => {
    return () => {
      eventSourcesRef.current.forEach(es => es.close());
      eventSourcesRef.current.clear();
      activeStreamsRef.current.clear();
    };
  }, []);

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

    const assistantMsgId = `temp-assistant-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      sessionId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setOptimisticMessages(prev => [...prev, userMsg, assistantMsg]);
    setSeenMessageIds(prev => new Set([...prev, userMsg.id, assistantMsgId]));

    await sendMessage(sessionId, content, {
      attachmentIds: selectedContextIds.length > 0 ? selectedContextIds : undefined,
      bm25: searchOptions.hybridSearch,
      rrf: searchOptions.rrfSearch,
      caching: searchOptions.caching,
      queryExpansion: searchOptions.queryExpansion,
      onComplete: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations', sessionId] });
      },
      onError: (error) => {
        console.error('Error sending message:', error);
        setOptimisticMessages(prev => prev.filter(msg => msg.id !== assistantMsgId));
      },
    });
  };


  const handleUploadComplete = (attachmentId: string) => {
    if (searchOptions.hybridSearch) {
      disableHybridSearch();
      
      toast.info('Hybrid Search disabled', {
        description: 'New files need BM25 indexing before using hybrid search',
        duration: 5000,
      });
    }
    
    setUploadedAttachments((prev) => [...prev, attachmentId]);
    
    // Force immediate refetch by invalidating with refetchType: 'active'
    queryClient.invalidateQueries({ 
      queryKey: ['sessions', sessionId, 'attachments'],
      refetchType: 'active'
    });
  };

  const handleCitationClick = (filename: string, page?: number) => {
    const attachment = sessionAttachments?.find((att: any) => att.filename === filename);
    if (attachment) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
      setSelectedPDF({
        filename: attachment.filename,
        url: `${baseUrl}/chat/attachments/${attachment.id}/file`,
        targetPage: page,
        type: attachment.type,
      });
    }
  };

  const handleAttachmentClick = (filename: string) => {
    handleCitationClick(filename);
  };

  const handleDocumentClick = (attachment: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';
    setSelectedPDF({
      filename: attachment.filename,
      url: `${baseUrl}/chat/attachments/${attachment.id}/file`,
      type: attachment.type,
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
            <div className="p-3">
            {displayMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                  <MessageSquare className="h-10 w-10 text-primary/50" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                <p className="text-muted-foreground max-w-sm">
                  Upload documents and ask questions to get AI-powered insights from your files.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayMessages.map((message, index) => {
                  const isLastAssistantMessage = 
                    index === displayMessages.length - 1 && 
                    message.role === 'assistant';
                  const isNewMessage = !seenMessageIds.has(message.id);
                  
                  return (
                    <ChatMessage 
                      key={`${message.role}-${index}`}
                      message={message}
                      sessionAttachments={sessionAttachments}
                      userAvatar={authUser?.picture}
                      userName={authUser?.name}
                      isLoading={isLoadingResponse && isLastAssistantMessage}
                      isStreaming={isStreaming && isLastAssistantMessage}
                      isComplete={isComplete}
                      isNewMessage={isNewMessage}
                      onCitationClick={handleCitationClick}
                      onAttachmentClick={handleAttachmentClick}
                    />
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
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

              const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
              
              console.log('[Upload] Creating temporary file:', { tempId, filename: file.name });
              
              setTemporaryFiles(prev => new Map(prev).set(tempId, {
                id: tempId,
                filename: file.name,
                type: file.type.includes('pdf') ? 'pdf' : 'document',
                size: file.size,
                isTemporary: true,
                uploadProgress: 0,
                processingProgress: {
                  status: 'connected',
                  progress: 0,
                  message: 'Uploading...',
                },
              }));

              try {
                const result = await uploadFile.mutateAsync({ file, sessionId });
                
                console.log('[Upload] File uploaded, updating temp file with real ID:', { 
                  tempId, 
                  attachmentId: result.attachmentId,
                  filename: file.name 
                });
                
                setTemporaryFiles(prev => {
                  const tempFile = prev.get(tempId);
                  if (!tempFile) return prev;
                  
                  const newMap = new Map(prev);
                  newMap.set(tempId, {
                    ...tempFile,
                    realId: result.attachmentId,
                    uploadProgress: 100,
                    processingProgress: {
                      status: 'connected',
                      progress: 0,
                      message: 'Connecting...',
                    },
                  });
                  return newMap;
                });
                
                setTimeout(() => {
                  connectToFileProgressStream(result.attachmentId, file.name);
                }, 100);
                
                handleUploadComplete(result.attachmentId);
              } catch (error) {
                setTemporaryFiles(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(tempId);
                  return newMap;
                });
                
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
          selectedFilesCount={selectedContextIds.length}
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
      <div className="w-[500px] flex-shrink-0 h-full">
        <FilePanel
          attachments={mergedAttachments}
          selectedFile={selectedPDF}
          onClose={() => setSelectedPDF(undefined)}
          onDocumentClick={handleDocumentClick}
          onDeleteAttachment={handleDeleteAttachment}
          bm25Progress={bm25Progress}
          fileProcessingProgress={fileProcessingProgress}
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
