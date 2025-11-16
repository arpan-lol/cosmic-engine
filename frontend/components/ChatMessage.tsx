'use client';

import { Message } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Paperclip, Loader2 } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface ChatMessageProps {
  message: Message;
  userAvatar?: string;
  userName?: string;
  isLoading?: boolean;
}

export default function ChatMessage({ message, userAvatar, userName, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      className={cn(
        'flex gap-3 mb-4 items-start',
        isUser && 'justify-end',
        !isUser && !isSystem && 'justify-start',
        isSystem && 'justify-center'
      )}
    >
      {!isUser && !isSystem && (
        <div className="h-8 w-8 flex-shrink-0">
          <Image src="/logo.png" alt="AI" width={28} height={28} className="h-8 w-8" />
        </div>
      )}

      <Card
        className={cn(
          'max-w-[80%] border-0 shadow-none',
          isUser && 'bg-primary text-primary-foreground',
          !isUser && !isSystem && 'bg-sidebar',
          isSystem && 'bg-muted max-w-[60%]'
        )}
      >
        <CardContent className="p-3">
          {isLoading && !isUser && !isSystem ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : isUser || isSystem ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code: ({ node, inline, className, children, ...props }: any) => (
                    inline ? (
                      <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  ),
                  pre: ({ children, ...props }: any) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto" {...props}>
                      {children}
                    </pre>
                  ),
                  a: ({ children, ...props }: any) => (
                    <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  ),
                  table: ({ children, ...props }: any) => (
                    <div className="overflow-x-auto">
                      <table className="border-collapse border border-border" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }: any) => (
                    <th className="border border-border px-4 py-2 bg-muted" {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }: any) => (
                    <td className="border border-border px-4 py-2" {...props}>
                      {children}
                    </td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

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
            title={new Date(message.createdAt).toLocaleString('en-US', {
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
            {new Date(message.createdAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </CardContent>
      </Card>

      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={userAvatar} alt={userName || 'User'} />
          <AvatarFallback>{userName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
