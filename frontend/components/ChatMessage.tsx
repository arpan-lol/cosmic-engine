'use client';

import { Message } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Bot, Paperclip } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'justify-end' : 'justify-start',
        isSystem && 'justify-center'
      )}
    >
      {!isUser && !isSystem && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <Card
        className={cn(
          'max-w-[80%]',
          isUser && 'bg-primary text-primary-foreground',
          isSystem && 'bg-muted max-w-[60%]'
        )}
      >
        <CardContent className="p-3">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={cn(
                    'flex items-center gap-2 text-sm p-2 rounded border',
                    isUser
                      ? 'border-primary-foreground/20'
                      : 'border-border'
                  )}
                >
                  <Paperclip className="h-4 w-4" />
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    {attachment.filename}
                  </a>
                  <span className={cn(
                    'text-xs',
                    isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
                  )}>
                    ({(attachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          <div
            className={cn(
              'text-xs mt-2',
              isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'
            )}
          >
            {new Date(message.createdAt).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
