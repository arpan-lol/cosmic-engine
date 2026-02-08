'use client';

import { RefObject } from 'react';
import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from '@/components/ChatMessage';
import type { Message, Attachment } from '@/lib/types';

interface MessageListProps {
  messages: Message[];
  sessionAttachments?: Attachment[];
  userAvatar?: string;
  userName?: string;
  seenMessageIds: Set<string>;
  isLoadingResponse: boolean;
  isStreaming: boolean;
  isComplete: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onCitationClick: (filename: string, page?: number) => void;
  onAttachmentClick: (filename: string) => void;
}

export function MessageList({
  messages,
  sessionAttachments,
  userAvatar,
  userName,
  seenMessageIds,
  isLoadingResponse,
  isStreaming,
  isComplete,
  messagesEndRef,
  onCitationClick,
  onAttachmentClick,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full bg-background">
          <div className="p-3">
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <MessageSquare className="h-10 w-10 text-primary/50" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-muted-foreground max-w-sm">
                Upload documents and ask questions to get AI-powered insights from your files.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <ScrollArea className="h-full bg-background">
        <div className="p-3">
          <div className="space-y-2">
            {messages.map((message, index) => {
              const isLastAssistantMessage =
                index === messages.length - 1 &&
                message.role === 'assistant';
              const isNewMessage = !seenMessageIds.has(message.id);

              return (
                <ChatMessage
                  key={`${message.role}-${index}`}
                  message={message}
                  sessionAttachments={sessionAttachments}
                  userAvatar={userAvatar}
                  userName={userName}
                  isLoading={isLoadingResponse && isLastAssistantMessage}
                  isStreaming={isStreaming && isLastAssistantMessage}
                  isComplete={isComplete}
                  isNewMessage={isNewMessage}
                  onCitationClick={onCitationClick}
                  onAttachmentClick={onAttachmentClick}
                />
              );
            })}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
