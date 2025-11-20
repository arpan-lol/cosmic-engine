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
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);

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
    <div className="flex flex-col h-full">
      <Card className="border-b rounded-b-none p-0 bg-background sticky top-0 z-10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/sessions')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <CardTitle>{conversation.title || 'Untitled Conversation'}</CardTitle>
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
              onSelectionChange={setSelectedContextIds}
              isLoading={isLoadingAttachments}
            />
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 overflow-y-auto" ref={scrollAreaRef}>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="mt-0 rounded-t-none border-t sticky bottom-0 bg-background">
        <CardContent className="p-4 space-y-3">{error && (
            <Card className="border-destructive">
              <CardContent className="p-3 text-sm text-destructive">
                Error: {error}
              </CardContent>
            </Card>
          )}

          <FileUploadButton sessionId={sessionId} onUploadComplete={handleUploadComplete} />

          {uploadedAttachments.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <div className="text-sm text-muted-foreground">
                  {uploadedAttachments.length} file{uploadedAttachments.length !== 1 ? 's' : ''} ready to attach
                </div>
              </CardContent>
            </Card>
          )}

          <ChatInput
            onSend={handleSendMessage}
            disabled={isStreaming || isLoadingAttachments || hasProcessingAttachments}
            placeholder={
              isStreaming
                ? 'Waiting for response...'
                : isLoadingAttachments
                ? 'Loading attachments...'
                : hasProcessingAttachments
                ? 'Processing documents...'
                : 'Type your message... (Enter to send, Shift+Enter for new line)'
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
