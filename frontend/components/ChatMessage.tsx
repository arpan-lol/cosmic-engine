'use client';

import { useState, memo } from 'react';
import Image from 'next/image';
import { Loader2, Copy, Check, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { Message, Attachment } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatMessageTime, formatMessageDateTime, getDateTimeAttribute, formatDurationShort } from '@/lib/date-utils';
import { areAttachmentsEqual } from '@/lib/message-utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StreamingMessageContent } from '@/components/StreamingMessageContent';
import { AttachmentList } from '@/components/AttachmentList';
import { TimingBreakdownModal } from '@/components/TimingBreakdownModal';
import 'highlight.js/styles/github-dark.css';

interface ChatMessageProps {
  message: Message;
  sessionAttachments?: Attachment[];
  userAvatar?: string;
  userName?: string;
  isLoading?: boolean;
  isStreaming?: boolean;
  isComplete?: boolean;
  isNewMessage?: boolean;
  onCitationClick?: (filename: string, page?: number) => void;
  onAttachmentClick?: (filename: string) => void;
}

const AVATAR_SIZE = 32;
const AVATAR_SIZE_CLASS = 'h-8 w-8';
const COPY_SUCCESS_DURATION = 2000;

function ChatMessageComponent({ message, sessionAttachments, userAvatar, userName, isLoading, isStreaming = false, isComplete = false, isNewMessage = false, onCitationClick, onAttachmentClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    if (!message?.content) {
      toast.error('No content to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), COPY_SUCCESS_DURATION);
    } catch (error) {
      console.error('Failed to copy message:', {
        error,
        messageId: message.id,
        contentLength: message.content?.length,
      });
      setCopyError(true);
      toast.error('Failed to copy message to clipboard');
      setTimeout(() => setCopyError(false), COPY_SUCCESS_DURATION);
    }
  };

  const hasValidDate = message?.createdAt && !isNaN(new Date(message.createdAt).getTime());

  return (
    <div
      className={cn(
        'mb-4',
        isNewMessage && 'animate-in fade-in slide-in-from-bottom-4 duration-300',
        isUser && 'flex gap-3 items-start justify-end',
        !isUser && 'flex flex-col gap-2'
      )}
    >
      {!isUser && (
        <>
          <div className="flex gap-3 items-start">
            <div className={cn(AVATAR_SIZE_CLASS, 'flex-shrink-0')} aria-hidden="true">
              <Image 
                src="/logo.png" 
                alt="AI Assistant" 
                width={AVATAR_SIZE} 
                height={AVATAR_SIZE} 
                className={AVATAR_SIZE_CLASS}
                priority
              />
            </div>
            <Card className="max-w-[80%] border-0 shadow-none bg-muted/50">
              <CardContent className="p-3">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground" role="status" aria-live="polite" aria-busy="true">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span className="text-sm">Generating response...</span>
                  </div>
                ) : (
                  <ErrorBoundary>
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                      <StreamingMessageContent 
                        content={message.content} 
                        isStreaming={isStreaming}
                        isComplete={isComplete}
                        onCitationClick={onCitationClick} 
                      />
                    </div>
                  </ErrorBoundary>
                )}

                {hasValidDate && (
                  <div className="flex items-center justify-between mt-5">
                    <div className="flex items-center gap-2">
                      {!isLoading && message?.content && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                          onClick={handleCopy}
                          aria-label={copyError ? 'Failed to copy' : copied ? 'Message copied to clipboard' : 'Copy message to clipboard'}
                        >
                          {copyError ? (
                            <AlertCircle className="h-3 w-3" aria-hidden="true" />
                          ) : copied ? (
                            <Check className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                        </Button>
                      )}
                      {message.timeMetrics && !isLoading && (
                        <TimingBreakdownModal
                          timeMetrics={message.timeMetrics}
                          attachments={sessionAttachments}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 font-mono"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDurationShort(message.timeMetrics.totalRequestMs)}
                            </Button>
                          }
                        />
                      )}
                    </div>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={getDateTimeAttribute(message.createdAt)}
                      title={formatMessageDateTime(message.createdAt)}
                    >
                      {formatMessageTime(message.createdAt)}
                    </time>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {isUser && (
        <>
          <Card
            className={cn(
              'max-w-[80%] border-0 shadow-none',
              'bg-primary text-primary-foreground'
            )}
          >
            <CardContent className="p-3 space-y-2">
              <div className="whitespace-pre-wrap break-words">
                {message?.content || <span className="italic opacity-60">No message content</span>}
              </div>
              
              <AttachmentList attachments={message.attachments} onAttachmentClick={onAttachmentClick} />

              {hasValidDate && (
                <time
                  className="text-xs text-primary-foreground/60 block"
                  dateTime={getDateTimeAttribute(message.createdAt)}
                  title={formatMessageDateTime(message.createdAt)}
                >
                  {formatMessageTime(message.createdAt)}
                </time>
              )}
            </CardContent>
          </Card>
          <Avatar className={cn(AVATAR_SIZE_CLASS, 'flex-shrink-0')}>
            <AvatarImage src={userAvatar} alt={userName || 'User'} />
            <AvatarFallback>
              {userName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </>
      )}
    </div>
  );
}

const ChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.message?.id === nextProps.message?.id &&
    prevProps.message?.content === nextProps.message?.content &&
    prevProps.message?.createdAt === nextProps.message?.createdAt &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.isComplete === nextProps.isComplete &&
    prevProps.isNewMessage === nextProps.isNewMessage &&
    prevProps.userAvatar === nextProps.userAvatar &&
    prevProps.userName === nextProps.userName &&
    prevProps.onCitationClick === nextProps.onCitationClick &&
    prevProps.onAttachmentClick === nextProps.onAttachmentClick &&
    areAttachmentsEqual(prevProps.message?.attachments, nextProps.message?.attachments) &&
    areAttachmentsEqual(prevProps.sessionAttachments, nextProps.sessionAttachments)
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;