'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConversation } from '@/hooks/use-conversations';
import { useStreamMessage } from '@/hooks/use-stream-message';
import { useQueryClient } from '@tanstack/react-query';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import FileUploadButton from '@/components/FileUploadButton';
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

  const { data: conversation, isLoading } = useConversation(sessionId);
  const { sendMessage, isStreaming, streamedContent, error, reset } = useStreamMessage();

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (conversation?.messages) {
      setOptimisticMessages(conversation.messages);
    }
  }, [conversation?.messages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [optimisticMessages, streamedContent]);

  const handleSendMessage = async (content: string) => {
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
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

    await sendMessage(sessionId, content, {
      attachmentIds: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
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
    <div className="flex flex-col h-screen">
      <Card className="m-4 mb-0 border-b rounded-b-none p-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/sessions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle>{conversation.title || 'Untitled Conversation'}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Created {new Date(conversation.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="m-4 mt-0 flex-1 flex flex-col rounded-t-none">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            {displayMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Start a conversation by sending a message
              </div>
            ) : (
              <div>
                {displayMessages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />

          <div className="p-4 space-y-3">
            {error && (
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
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? 'Waiting for response...'
                  : 'Type your message... (Enter to send, Shift+Enter for new line)'
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
