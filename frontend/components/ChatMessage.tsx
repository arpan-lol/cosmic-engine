'use client';

import { Message } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Paperclip, Loader2, FileText } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface ChatMessageProps {
  message: Message;
  userAvatar?: string;
  userName?: string;
  isLoading?: boolean;
  onCitationClick?: (filename: string, page?: number) => void;
}

interface Citation {
  text: string;
  filename: string;
  page?: number;
  excerptNumber?: number;
}

function parseCitations(text: string): (string | Citation)[] {
  const citationRegex = /\[SOURCE:\s*([^\|]+?)\s*\|\s*(?:Page\s*(\d+)|Excerpt\s*(\d+))\]/gi;
  const parts: (string | Citation)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const filename = match[1].trim();
    const page = match[2] ? parseInt(match[2], 10) : undefined;
    const excerptNumber = match[3] ? parseInt(match[3], 10) : undefined;

    parts.push({
      text: match[0],
      filename,
      page,
      excerptNumber,
    });

    lastIndex = match.index + match[0].length;
    
    // Skip trailing period or punctuation immediately after citation
    if (lastIndex < text.length && /[.,;:!?]/.test(text[lastIndex])) {
      lastIndex++;
    }
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export default function ChatMessage({ message, userAvatar, userName, isLoading, onCitationClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const renderContentWithCitations = (content: string) => {
    const parts = parseCitations(content);
    
    return parts.map((part, index) => {
      if (typeof part === 'string') {
        return <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm, remarkBreaks]}
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
          {part}
        </ReactMarkdown>;
      } else {
        const pageLabel = part.page ? `Page ${part.page}` : part.excerptNumber ? `Page ${part.excerptNumber}` : part.filename;
        return (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1 mx-1 h-6 text-xs"
            onClick={() => onCitationClick?.(part.filename, part.page || part.excerptNumber)}
            title={part.filename}
          >
            <FileText className="h-3 w-3" />
            {pageLabel}
          </Button>
        );
      }
    });
  };

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
          isSystem && 'bg-muted/50 border border-border max-w-[70%]'
        )}
      >
        <CardContent className={cn('p-3', isSystem && 'py-2')}>
          {isLoading && !isUser && !isSystem ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          ) : isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : isSystem ? (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {renderContentWithCitations(message.content)}
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

          {!isSystem && (
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
          )}
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
