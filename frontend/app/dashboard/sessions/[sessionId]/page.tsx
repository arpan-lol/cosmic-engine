'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation } from '@/hooks/use-conversations';
import { useStreamMessage } from '@/hooks/use-stream-message';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionAttachments } from '@/hooks/use-upload';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import FileUploadButton from '@/components/FileUploadButton';
import AttachmentSelector from '@/components/AttachmentSelector';
import FilePanel from '@/components/FilePanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Message } from '@/lib/types';

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

  const { data: authUser } = useAuth();
  const { data: conversation, isLoading } = useConversation(sessionId);
  const { data: sessionAttachments, isLoading: isLoadingAttachments } = useSessionAttachments(sessionId);
  const { sendMessage, isStreaming, streamedContent, error, reset } = useStreamMessage();

  console.log('User avatar data:', { picture: authUser?.picture, name: authUser?.name });

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (conversation?.messages) {
      setOptimisticMessages(conversation.messages);
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

  // Auto-select newly uploaded attachments
  useEffect(() => {
    if (sessionAttachments && sessionAttachments.length > 0) {
      const processedAttachmentIds = sessionAttachments
        .filter((att: any) => att.metadata?.processed)
        .map((att: any) => att.id);
      
      // Find newly uploaded files that aren't already selected
      const newAttachments = uploadedAttachments.filter(id => 
        processedAttachmentIds.includes(id) && !selectedContextIds.includes(id)
      );
      
      if (newAttachments.length > 0) {
        setSelectedContextIds(prev => [...prev, ...newAttachments]);
      }
    }
  }, [sessionAttachments, uploadedAttachments, selectedContextIds]);

  const handleSendMessage = async (content: string) => {
    const attachments = uploadedAttachments.length > 0 
      ? conversation?.attachments?.filter((att: any) => uploadedAttachments.includes(att.id)) || []
      : undefined;

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      attachments,
    };

    setOptimisticMessages((prev) => [...prev, tempUserMessage]);

    const tempAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      sessionId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setOptimisticMessages((prev) => [...prev, tempAssistantMessage]);

    const messageIndex = optimisticMessages.length + 1;

    await sendMessage(sessionId, content, {
      attachmentIds: selectedContextIds.length > 0 ? selectedContextIds : (uploadedAttachments.length > 0 ? uploadedAttachments : undefined),
      onComplete: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations', sessionId] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        reset();
        setUploadedAttachments([]);
      },
      onError: (error) => {
        console.error('Error sending message:', error);
      },
    });
  };

  const handleUploadComplete = (attachmentId: string) => {
    setUploadedAttachments((prev) => [...prev, attachmentId]);
    // Refetch attachments to update the file panel
    queryClient.invalidateQueries({ queryKey: ['sessions', sessionId, 'attachments'] });
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

  const displayMessages = [...optimisticMessages];
  const isLoadingResponse = isStreaming && !streamedContent;
  
  // Check if any attachments are currently being processed
  const hasProcessingAttachments = sessionAttachments?.some(
    (att: any) => !att.metadata?.processed && !att.metadata?.error
  ) || false;
  
  if (isStreaming && streamedContent) {
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
              />
            </div>
          </CardHeader>
        </Card>

        <div className="flex-1 overflow-y-auto min-h-0" ref={scrollAreaRef}>
        <div className="p-4">
          {displayMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Start a conversation by sending a message
            </div>
          ) : (
            <div>
              {displayMessages.map((message, index) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  userAvatar={authUser?.picture}
                  userName={authUser?.name}
                  isLoading={isLoadingResponse && index === displayMessages.length - 1 && message.role === 'assistant'}
                  onCitationClick={handleCitationClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="mt-0 bg-background flex-shrink-0 border-0 border-t rounded-none">
        <CardContent className="p-2 space-y-2">{error && (
            <Card className="border-destructive">
              <CardContent className="p-3 text-sm text-destructive">
                Error! The server might be overloaded. Please try again.
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-2">
            <FileUploadButton sessionId={sessionId} onUploadComplete={handleUploadComplete} />
          </div>

          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming || isLoadingAttachments || hasProcessingAttachments}
            loading={isLoadingAttachments}
            placeholder={
              isStreaming
                ? 'Waiting for response...'
                : isLoadingAttachments
                ? 'Loading...'
                : hasProcessingAttachments
                ? 'Processing documents...'
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
        />
      </div>
    </div>
  );
}
